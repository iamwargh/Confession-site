'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SetUsernamePage() {
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkWait, setCheckWait] = useState(false)
    const [available, setAvailable] = useState<boolean | null>(null)
    const [error, setError] = useState('')
    const router = useRouter()

    const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)

    useEffect(() => {
        if (!username) {
            setAvailable(null)
            return
        }

        if (!usernameValid) {
            setAvailable(false)
            return
        }

        const timer = setTimeout(async () => {
            setCheckWait(true)
            try {
                const res = await fetch(`/api/username-check?username=${encodeURIComponent(username)}`)
                const data = await res.json()
                if (data.available !== undefined) {
                    setAvailable(data.available)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setCheckWait(false)
            }
        }, 500) // debounce API call

        return () => clearTimeout(timer)
    }, [username, usernameValid])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!usernameValid || available === false) return

        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/set-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to update username')
                setLoading(false)
                return
            }

            // Success, redirect home or dashboard
            router.push('/')
            router.refresh()
        } catch (err) {
            console.error(err)
            setError('An error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Set Your Username</h1>
                    <p className="text-muted-foreground text-sm">
                        Almost there! Pick a unique username to continue.
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1">
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="set-username" className="text-sm font-medium">Username</label>
                        <div className="relative">
                            <input
                                id="set-username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="anonymous_soul"
                                maxLength={20}
                                required
                                disabled={loading}
                                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50"
                            />
                            {username.length > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {checkWait ? (
                                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                    ) : available === true ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            3–20 chars, letters, numbers, and underscores only.
                        </p>
                        {available === false && usernameValid && !checkWait && (
                            <p className="text-xs text-destructive mt-1">
                                This username is already taken.
                            </p>
                        )}
                        {!usernameValid && username.length > 0 && (
                            <p className="text-xs text-destructive mt-1">
                                Username does not meet the requirements.
                            </p>
                        )}
                    </div>

                    <Button
                        id="set-username-btn"
                        type="submit"
                        disabled={loading || !usernameValid || available === false || checkWait}
                        className="w-full h-11"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                        ) : (
                            'Set Username & Continue'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
