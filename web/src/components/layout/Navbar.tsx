'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, TrendingUp, Plus, User, LogOut, Sun, Moon, Menu, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [mobileOpen, setMobileOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    // Apply theme to <html>
    useEffect(() => {
        const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
        const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        setTheme(preferred)
        document.documentElement.classList.toggle('dark', preferred === 'dark')
    }, [])

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        localStorage.setItem('theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
    }

    // Fetch auth state
    useEffect(() => {
        const supabase = createClient()

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('username, role')
                    .eq('id', user.id)
                    .single()
                setProfile(prof)
            }
            setLoading(false)
        }

        fetchUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
            if (!session?.user) {
                setProfile(null)
                setLoading(false)
            } else {
                fetchUser()
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/')
        router.refresh()
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
    const isSuperAdmin = profile?.role === 'superadmin'

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/trending', label: 'Trending', icon: TrendingUp },
    ]

    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 max-w-screen-xl mx-auto gap-4">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-primary mr-4 shrink-0">
                    <Heart className="h-5 w-5 fill-current" />
                    <span className="hidden sm:inline text-sm font-bold tracking-tight">
                        Off<span className="text-foreground">Chest</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium flex-1">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-1.5 transition-colors hover:text-foreground',
                                pathname === href ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {label}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link
                            href={isSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard'}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Shield className="h-3.5 w-3.5" />
                            {isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </Link>
                    )}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Theme Toggle */}
                    <button
                        id="theme-toggle"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {!loading && (
                        <>
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/post">
                                        <button
                                            id="post-confession-btn"
                                            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Confess
                                        </button>
                                    </Link>
                                    <Link href="/my-confessions">
                                        <button
                                            id="my-confessions-btn"
                                            aria-label="My Confessions"
                                            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            <User className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <button
                                        id="sign-out-btn"
                                        onClick={handleSignOut}
                                        aria-label="Sign out"
                                        className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <button
                                            id="login-btn"
                                            className="h-9 px-4 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            Login
                                        </button>
                                    </Link>
                                    <Link href="/signup">
                                        <button
                                            id="signup-btn"
                                            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            Sign Up
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        className="md:hidden h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-2 bg-background">
                    {navLinks.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {label}
                        </Link>
                    ))}
                    {user && (
                        <>
                            <Link href="/post" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary">
                                + Confess
                            </Link>
                            <Link href="/my-confessions" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                                My Confessions
                            </Link>
                        </>
                    )}
                    {isAdmin && (
                        <Link
                            href={isSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard'}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Admin Panel
                        </Link>
                    )}
                </div>
            )}
        </nav>
    )
}
