'use client'

/**
 * RESET PASSWORD PAGE — AI-8 (Claude Sonnet 4.6)
 * User lands here after clicking reset link in email.
 * Supabase handles the token in the URL hash.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, XCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    // Supabase processes the token from URL hash automatically when using createClient
    useEffect(() => {
        const supabase = createClient()
        // Listen for the PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User is authenticated via recovery token — allow password update
            }
        })
        return () => subscription.unsubscribe()
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

    if (success) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Password updated!</h1>
                    <p className="text-muted-foreground">Your password has been changed. Redirecting you home...</p>
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
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Toggle"
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
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
