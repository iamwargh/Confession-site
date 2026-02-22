'use client'

/**
 * SIGNUP PAGE — AI-5 (Claude Sonnet 4.6)
 * Email + Password + Username signup + Google & X (Twitter) OAuth
 * 
 * FIXES:
 * 1. Resolved "Database error updating user" by catching metadata update failures.
 * 2. Removed potential "ghost" updateUser calls.
 * 3. Fixed AUTH-8: Proper email regex validation.
 * 4. Addressed AUTH-10: Refactored social icons and aligned with project UI.
 * 5. Added robust uniqueness check for usernames.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Heart, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

function OrDivider({ label = 'or sign up with email' }: { label?: string }) {
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [xLoading, setXLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    // Validation
    const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
    const passwordStrong = password.length >= 8
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    // ── OAuth handlers ────────────────────────────────────────────────────────

    async function handleGoogleSignup() {
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
    }

    async function handleXSignup() {
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

    // ── Email/password signup ─────────────────────────────────────────────────

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Basic front-end validation
        if (!emailValid) {
            setError('Please enter a valid email address.')
            setLoading(false); return
        }
        if (!usernameValid) {
            setError('Username must be 3–20 chars, letters/numbers/underscores only.')
            setLoading(false); return
        }
        if (!passwordStrong) {
            setError('Password must be at least 8 characters.')
            setLoading(false); return
        }

        const supabase = createClient()

        // 1. Check username uniqueness directly in public.profiles
        const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .maybeSingle()

        if (checkError) {
            console.error('[signup] Username check failed:', checkError)
            // We continue as the signUp call will also be caught by DB triggers/constraints
        }

        if (existing) {
            setError('This username is already taken. Please choose another.')
            setLoading(false); return
        }

        /**
         * 2. SUPABASE AUTH SIGNUP
         * Passing username in 'data' is the correct way to map to raw_user_meta_data.
         * Our DB trigger handle_new_user() uses this to create the profile.
         */
        const { error: signupError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                // Correct way to pass metadata. Maps to NEW.raw_user_meta_data in trigger.
                data: { username: username.toLowerCase().trim() },
                emailRedirectTo: `${siteUrl}/auth/callback`,
            },
        })

        if (signupError) {
            console.error('[signup] signUp error:', signupError)

            // Map common Supabase Auth/DB errors to user-friendly messages
            if (signupError.message.includes('already registered')) {
                setError('An account with this email already exists. Try logging in.')
            } else if (
                signupError.message.includes('Database error saving new user') ||
                signupError.message.includes('Database error updating user')
            ) {
                // These errors often mean the trigger failed (e.g. username unique constraint)
                setError('This username is likely taken or there was a temporary database issue. Please try another.')
            } else {
                setError(signupError.message)
            }

            setLoading(false)
            return
        }

        /**
         * NOTE: No extra updateUser() call here. 
         * The profile is created automatically and atomically via the DB trigger.
         */

        setSuccess(true)
        setLoading(false)
    }

    // ── Success screen ────────────────────────────────────────────────────────

    if (success) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Check your email!</h1>
                    <p className="text-muted-foreground">
                        We sent a verification link to <strong className="text-foreground">{email}</strong>.
                        Click it to activate your account.
                    </p>
                    <Link href="/login" className="inline-block text-primary hover:underline text-sm font-medium">
                        Back to Login →
                    </Link>
                </div>
            </div>
        )
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
                    <h1 className="text-3xl font-bold tracking-tight">Join OffChest</h1>
                    <p className="text-muted-foreground text-sm">
                        Share your truth, anonymously and safely.
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1">
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Social Buttons ── */}
                <div className="space-y-3">
                    <Button
                        id="signup-google-btn"
                        variant="outline"
                        className="w-full h-11 bg-white hover:bg-gray-50 text-gray-800 border-gray-200 gap-3"
                        onClick={handleGoogleSignup}
                        disabled={anyLoading}
                    >
                        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </Button>
                    <Button
                        id="signup-x-btn"
                        variant="default"
                        className="w-full h-11 bg-black hover:bg-black/90 text-white gap-3"
                        onClick={handleXSignup}
                        disabled={anyLoading}
                    >
                        {xLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon />}
                        {xLoading ? 'Connecting...' : 'Continue with X'}
                    </Button>
                </div>

                <OrDivider />

                {/* ── Email Form ── */}
                <form onSubmit={handleSignup} className="space-y-5">

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-email" className="text-sm font-medium">Email Address</label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={anyLoading}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                        />
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-username" className="text-sm font-medium">Username</label>
                        <div className="relative">
                            <input
                                id="signup-username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="anonymous_soul"
                                maxLength={20}
                                required
                                disabled={anyLoading}
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                            />
                            {username.length > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {usernameValid
                                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                                        : <XCircle className="h-4 w-4 text-destructive" />
                                    }
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            3–20 chars, letters/numbers/underscores only.
                        </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-password" className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                                disabled={anyLoading}
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {/* Status bar */}
                        {password.length > 0 && (
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 2
                                            ? passwordStrong ? 'bg-green-500' : 'bg-amber-400'
                                            : 'bg-border'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        id="signup-submit-btn"
                        type="submit"
                        disabled={anyLoading || !usernameValid || !passwordStrong || !emailValid}
                        className="w-full h-11"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                        ) : (
                            'Create Account'
                        )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        By signing up, you agree to our{' '}
                        <Link href="/terms-of-service" className="underline hover:text-foreground">Terms</Link>
                        {' '}and{' '}
                        <Link href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                    </p>
                </form>

                <p className="text-center text-sm text-muted-foreground pt-2">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    )
}
