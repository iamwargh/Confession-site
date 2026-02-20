'use client'

/**
 * LOGIN PAGE — AI-6 (Claude Sonnet 4.6)
 * Email + Password login. Handles: suspended users, unverified email, wrong creds.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

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
                // Sign them out immediately
                await supabase.auth.signOut()
                const until = profile.suspended_until
                    ? ` until ${new Date(profile.suspended_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : ' permanently'
                setError(`Your account has been suspended${until}. Reason: ${profile.suspension_reason || 'Violation of terms.'}`)
                setLoading(false)
                return
            }
        }

        router.push(redirectTo)
        router.refresh()
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
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

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

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
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                        disabled={loading}
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
