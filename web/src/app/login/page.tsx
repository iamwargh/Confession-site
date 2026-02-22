'use client'

/**
 * LOGIN PAGE — AI-6 (Claude Sonnet 4.6)
 * Email + Password login + Google & X (Twitter) OAuth
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { Suspense } from 'react'

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
        </svg>
    )
}

function XIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.245 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
    )
}

// ── Social Button Component ────────────────────────────────────────────────────

function SocialButton({
    id,
    onClick,
    loading,
    icon,
    label,
    variant,
}: {
    id: string
    onClick: () => void
    loading: boolean
    icon: React.ReactNode
    label: string
    variant: 'google' | 'x'
}) {
    const isGoogle = variant === 'google'
    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
            disabled={loading}
            className={`
                w-full h-11 rounded-lg flex items-center justify-center gap-3 text-sm font-medium
                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                border focus:outline-none focus:ring-2 focus:ring-offset-1
                ${isGoogle
                    ? 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 focus:ring-gray-300 focus:ring-offset-[#1a1a1a]'
                    : 'bg-black text-white border-white/10 hover:bg-[#111] focus:ring-white/20 focus:ring-offset-[#1a1a1a]'
                }
            `}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                icon
            )}
            {!loading && <span>{label}</span>}
            {loading && <span>Connecting...</span>}
        </button>
    )
}

// ── Divider ────────────────────────────────────────────────────────────────────

function OrDivider({ label = 'or continue with email' }: { label?: string }) {
    return (
        <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap font-medium">
                {label}
            </span>
            <div className="flex-1 h-px bg-border/60" />
        </div>
    )
}

// ── Main Form ──────────────────────────────────────────────────────────────────

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [xLoading, setXLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'
    const [error, setError] = useState(searchParams.get('error') || '')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    // ── OAuth handlers ────────────────────────────────────────────────────────

    async function handleGoogleLogin() {
        setError('')
        setGoogleLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        })
        if (error) {
            setError(error.message)
            setGoogleLoading(false)
        }
        // On success, browser redirects — no need to reset loading
    }

    async function handleXLogin() {
        setError('')
        setXLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'twitter',
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        })
        if (error) {
            setError(error.message)
            setXLoading(false)
        }
    }

    // ── Email/password handler ─────────────────────────────────────────────────

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const supabase = createClient()

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (loginError) {
            if (loginError.message.includes('Email not confirmed')) {
                setError('Please verify your email before logging in. Check your inbox.')
            } else if (loginError.message.includes('Invalid login credentials')) {
                setError('Wrong email or password. Please try again.')
            } else {
                setError(loginError.message)
            }
            setLoading(false)
            return
        }

        // Check if user is suspended
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_suspended, suspended_until, suspension_reason')
                .eq('id', data.user.id)
                .single()

            if (profile?.is_suspended) {
                // Check if suspension has expired
                if (profile.suspended_until && new Date(profile.suspended_until) < new Date()) {
                    // Suspension expired - auto-unsuspend via RPC
                    await supabase.rpc('check_suspension_expired', { user_uuid: data.user.id })
                    // Allow login to continue
                } else {
                    // Still suspended
                    await supabase.auth.signOut()
                    const until = profile.suspended_until
                        ? ` until ${new Date(profile.suspended_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : ' permanently'
                    setError(`Your account has been suspended${until}. Reason: ${profile.suspension_reason || 'Violation of terms.'}`)
                    setLoading(false)
                    return
                }
            }
        }

        router.push(redirectTo)
        router.refresh()
    }

    const anyLoading = loading || googleLoading || xLoading

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-muted-foreground text-sm">
                        Your secrets are safe here.
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Social Buttons ── */}
                <div className="space-y-3">
                    <SocialButton
                        id="login-google-btn"
                        onClick={handleGoogleLogin}
                        loading={googleLoading}
                        icon={<GoogleIcon />}
                        label="Continue with Google"
                        variant="google"
                    />
                    <SocialButton
                        id="login-x-btn"
                        onClick={handleXLogin}
                        loading={xLoading}
                        icon={<XIcon />}
                        label="Continue with X"
                        variant="x"
                    />
                </div>

                {/* ── Divider ── */}
                <OrDivider />

                {/* ── Email / Password Form ── */}
                <form onSubmit={handleLogin} className="space-y-5">

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="login-email" className="text-sm font-medium">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            disabled={anyLoading}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="login-password" className="text-sm font-medium">Password</label>
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                required
                                autoComplete="current-password"
                                disabled={anyLoading}
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={anyLoading}
                        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                {/* Signup link */}
                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                        Sign up free
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <LoginForm />
        </Suspense>
    )
}
