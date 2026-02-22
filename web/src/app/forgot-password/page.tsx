'use client'

/**
 * FORGOT PASSWORD PAGE — AI-8 (Claude Sonnet 4.6)
 * Send reset link via Supabase. Also handles the reset form after redirect.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Heart, Loader2, XCircle, CheckCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    async function handleSendReset(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const supabase = createClient()

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/reset-password`,
        })

        if (resetError) {
            setError(resetError.message)
            setLoading(false)
            return
        }

        setSent(true)
        setLoading(false)
    }

    if (sent) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Reset link sent!</h1>
                    <p className="text-muted-foreground">
                        We sent a password reset link to{' '}
                        <strong className="text-foreground">{email}</strong>.
                        Check your inbox and spam folder.
                    </p>
                    <Link href="/login" className="inline-block text-primary hover:underline text-sm font-medium">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
                    <p className="text-muted-foreground text-sm">
                        Enter your email and we&apos;ll send you a reset link.
                    </p>
                </div>

                <form onSubmit={handleSendReset} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="forgot-email" className="text-sm font-medium">Email address</label>
                        <input
                            id="forgot-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                        />
                    </div>

                    <button
                        id="forgot-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Remembered it?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    )
}
