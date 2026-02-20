'use client'

/**
 * SIGNUP PAGE — AI-5 (Claude Sonnet 4.6)
 * Email + Password + Username signup with unique check + char limits
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    // Validation rules
    const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
    const passwordStrong = password.length >= 8
    const emailValid = email.includes('@') && email.includes('.')

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Client-side validation
        if (!emailValid) {
            setError('Please enter a valid email address.')
            setLoading(false)
            return
        }
        if (username.length < 3 || username.length > 20) {
            setError('Username must be between 3 and 20 characters.')
            setLoading(false)
            return
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username can only contain letters, numbers, and underscores.')
            setLoading(false)
            return
        }
        if (!passwordStrong) {
            setError('Password must be at least 8 characters.')
            setLoading(false)
            return
        }

        const supabase = createClient()

        // Check username uniqueness
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .single()

        if (existing) {
            setError('This username is already taken. Please choose another.')
            setLoading(false)
            return
        }

        // Create the Supabase Auth user
        const { data, error: signupError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    username: username.toLowerCase().trim(),
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (signupError) {
            if (signupError.message.includes('already registered')) {
                setError('An account with this email already exists. Try logging in.')
            } else {
                setError(signupError.message)
            }
            setLoading(false)
            return
        }

        // Show success — user needs to verify email
        setSuccess(true)
        setLoading(false)
    }

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

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Join the community</h1>
                    <p className="text-muted-foreground text-sm">
                        Share your truth, anonymously and safely.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSignup} className="space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-email" className="text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                        />
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-username" className="text-sm font-medium">
                            Username
                        </label>
                        <div className="relative">
                            <input
                                id="signup-username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="anonymous_soul"
                                maxLength={20}
                                required
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                            3–20 chars, letters/numbers/underscores only. ({username.length}/20)
                        </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="signup-password" className="text-sm font-medium">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="signup-password"
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {/* Password strength indicator */}
                        {password.length > 0 && (
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 2
                                            ? password.length >= 8 ? 'bg-green-500' : 'bg-amber-400'
                                            : 'bg-border'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        id="signup-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Terms */}
                    <p className="text-center text-xs text-muted-foreground">
                        By signing up, you agree to our{' '}
                        <Link href="/terms-of-service" className="underline hover:text-foreground">Terms</Link>
                        {' '}and{' '}
                        <Link href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                    </p>
                </form>

                {/* Login link */}
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    )
}
