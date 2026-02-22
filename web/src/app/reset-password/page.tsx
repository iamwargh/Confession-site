'use client'

/**
 * RESET PASSWORD PAGE — AI-8 (Claude Sonnet 4.6)
 * User lands here after clicking reset link in email.
 * Supabase handles the token in the URL hash.
 *
 * FIX: Added isRecoveryMode guard — the form is only accessible
 * after a PASSWORD_RECOVERY event fires. If a user navigates here
 * directly (without a valid reset link), they see an error state
 * instead of a live password-change form.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, XCircle, CheckCircle, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    // Guard: only true when a genuine PASSWORD_RECOVERY event arrives
    const [isRecoveryMode, setIsRecoveryMode] = useState(false)
    // Checking = true while we wait for Supabase to process the URL hash token
    const [checking, setChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        // Supabase reads the #access_token hash from the URL automatically.
        // We listen for PASSWORD_RECOVERY to confirm it's a valid reset link.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Valid recovery token received — allow the form
                setIsRecoveryMode(true)
                setChecking(false)
            } else if (event === 'SIGNED_IN') {
                // A normal sign-in event (not recovery) — do NOT allow reset
                setChecking(false)
            } else {
                setChecking(false)
            }
        })

        // Fallback: if no auth state event fires within 2.5s,
        // stop the loading spinner and show the invalid-link state.
        const timeout = setTimeout(() => setChecking(false), 2500)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [])

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setLoading(true)
        const supabase = createClient()

        const { error: updateError } = await supabase.auth.updateUser({
            password,
        })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)

        // Redirect to home after 2 seconds
        setTimeout(() => router.push('/'), 2000)
    }

    // ── Waiting for Supabase to verify the token ──────────────────────────────
    if (checking) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
                </div>
            </div>
        )
    }

    // ── Success screen ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Password updated!</h1>
                    <p className="text-muted-foreground">Your password has been changed. Redirecting you home…</p>
                </div>
            </div>
        )
    }

    // ── Invalid / expired link screen ──────────────────────────────────────────
    if (!isRecoveryMode) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Link invalid or expired</h1>
                    <p className="text-muted-foreground text-sm">
                        This password reset link has already been used, expired, or is invalid.
                        Please request a new one.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-block h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors leading-10"
                    >
                        Request new reset link
                    </Link>
                </div>
            </div>
        )
    }

    // ── Password reset form (only shown in recovery mode) ──────────────────────
    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
                    <p className="text-muted-foreground text-sm">Choose a strong, secure password.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="reset-password" className="text-sm font-medium">New Password</label>
                        <div className="relative">
                            <input
                                id="reset-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                                disabled={loading}
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

                    <div className="space-y-1.5">
                        <label htmlFor="reset-confirm-password" className="text-sm font-medium">Confirm Password</label>
                        <input
                            id="reset-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            required
                            disabled={loading}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Passwords don&apos;t match
                            </p>
                        )}
                    </div>

                    <button
                        id="reset-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
