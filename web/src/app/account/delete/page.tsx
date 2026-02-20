'use client'

/**
 * ACCOUNT DELETE PAGE — AI-10 (Claude Sonnet 4.6)
 * Confirmation modal + data purge from Supabase.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, XCircle, Trash2 } from 'lucide-react'

export default function DeleteAccountPage() {
    const [confirmText, setConfirmText] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'warning' | 'confirm'>('warning')
    const router = useRouter()

    async function handleDelete(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (confirmText !== 'DELETE MY ACCOUNT') {
            setError('Please type exactly: DELETE MY ACCOUNT')
            return
        }

        setLoading(true)
        const supabase = createClient()

        // Re-authenticate to verify password
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) {
            setError('Not authenticated.')
            setLoading(false)
            return
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
        })

        if (authError) {
            setError('Incorrect password. Please try again.')
            setLoading(false)
            return
        }

        // Call the account delete API
        const res = await fetch('/api/account/delete', { method: 'POST' })
        const result = await res.json()

        if (!result.success) {
            setError(result.error || 'Failed to delete account.')
            setLoading(false)
            return
        }

        // Sign out and redirect
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-6">
                {step === 'warning' ? (
                    <>
                        <div className="text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-destructive">Delete Account</h1>
                            <p className="text-muted-foreground text-sm">
                                This will permanently delete your account and all your data. This cannot be undone.
                            </p>
                        </div>

                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                            <p className="text-sm font-medium">What will be deleted:</p>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Your account and profile</li>
                                <li>All your confessions</li>
                                <li>All your likes</li>
                                <li>All reports you submitted</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep('confirm')}
                                className="flex-1 h-10 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                            >
                                I understand, continue
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Confirm Deletion</h1>
                            <p className="text-muted-foreground text-sm">This is irreversible.</p>
                        </div>

                        <form onSubmit={handleDelete} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="delete-password" className="text-sm font-medium">
                                    Confirm your password
                                </label>
                                <input
                                    id="delete-password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Your current password"
                                    required
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="delete-confirm-text" className="text-sm font-medium">
                                    Type <strong className="text-destructive">DELETE MY ACCOUNT</strong> to confirm
                                </label>
                                <input
                                    id="delete-confirm-text"
                                    type="text"
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
                                    placeholder="DELETE MY ACCOUNT"
                                    required
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent transition-colors font-mono"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('warning')}
                                    className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    id="delete-account-btn"
                                    type="submit"
                                    disabled={loading || confirmText !== 'DELETE MY ACCOUNT'}
                                    className="flex-1 h-10 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-4 w-4" />Delete Forever</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
