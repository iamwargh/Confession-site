'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, TrendingUp, Plus, User, LogOut, Sun, Moon, Menu, X, Shield, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * NAVBAR — Fully server-proxied auth state.
 *
 * CRITICAL: NO direct browser→Supabase calls.
 * All auth state is fetched from /api/auth/me (server-side).
 * This bypasses ISP-level blocking of *.supabase.co domains.
 */

type UserData = {
    id: string
    email: string
} | null

type ProfileData = {
    username: string | null
    role: string | null
    is_suspended: boolean | null
} | null

export function Navbar() {
    const [user, setUser] = useState<UserData>(null)
    const [profile, setProfile] = useState<ProfileData>(null)
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

    // Fetch auth state from server-side API (bypasses ISP block)
    const fetchAuthState = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me', {
                // Include cookies for session
                credentials: 'same-origin',
            })
            if (!res.ok) {
                setUser(null)
                setProfile(null)
                return
            }
            const data = await res.json()
            setUser(data.user || null)
            setProfile(data.profile || null)
        } catch {
            // Network error — treat as unauthenticated
            setUser(null)
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch auth state on mount and whenever pathname changes
    // (login/signup pages do router.refresh() after success)
    useEffect(() => {
        fetchAuthState()
    }, [fetchAuthState, pathname])

    const handleSignOut = async () => {
        try {
            // Use server-side signout to avoid ISP blocking *.supabase.co
            await fetch('/api/auth/signout', { method: 'POST' })
        } catch {
            // Even if the network call fails, clear local state
        }
        setUser(null)
        setProfile(null)
        router.push('/login')
        router.refresh()
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
    const isSuperAdmin = profile?.role === 'superadmin'

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/trending', label: 'Trending', icon: TrendingUp },
        { href: '/18-plus', label: '18+', icon: Flame },
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
                                    <Link href="/account">
                                        <button
                                            id="account-btn"
                                            aria-label="My Account"
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
                            <Link href="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                                My Account
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
