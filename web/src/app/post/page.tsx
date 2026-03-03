'use client'

/**
 * POST CONFESSION PAGE — AI-11 (Claude Sonnet 4.6)
 * Text-only, 1000 char limit, char counter, rate limit check, mental health banner
 * 
 * FIX: Removed client-side keyword-filter logic to prevent leaking 
 * sensitive blocked words in the JS bundle. All moderate is now server-side.
 */

import { useState } from 'react'
import { createConfession } from '@/lib/actions/confessions'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { MentalHealthWarning } from '@/components/moderation/MentalHealthWarning'

const MAX_CHARS = 1000
const MIN_CHARS = 10

export default function PostConfessionPage() {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showMentalHealthBanner, setShowMentalHealthBanner] = useState(false)
    const [detectedKeywords, setDetectedKeywords] = useState<string[]>([])
    const [isAdultPost, setIsAdultPost] = useState(false)

    const remaining = MAX_CHARS - content.length
    const isValid = content.trim().length >= MIN_CHARS && content.length <= MAX_CHARS

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await createConfession(content)

        if (!result.success) {
            setError(result.error || 'Something went wrong.')
            setLoading(false)
            return
        }

        if (result.data?.showMentalHealthBanner) {
            setShowMentalHealthBanner(true)
            setDetectedKeywords(result.data.mentalHealthKeywordsFound || [])
        }

        if (result.data?.isAdult) {
            setIsAdultPost(true)
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    {showMentalHealthBanner && (
                        <div className="mb-6">
                            <MentalHealthWarning
                                show={true}
                                variant="poster"
                                detectedKeywords={detectedKeywords}
                            />
                        </div>
                    )}
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Confession posted!</h1>
                    <p className="text-muted-foreground">
                        Your truth has been shared anonymously.
                        {isAdultPost && <><br /><span className="text-rose-500 font-medium mt-1 inline-block">It was automatically categorized as 18+ content.</span></>}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => { setSuccess(false); setContent(''); setShowMentalHealthBanner(false); setIsAdultPost(false); }}
                            className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
                        >
                            Post another
                        </button>
                        <Link href={isAdultPost ? "/18-plus" : "/"} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center">
                            View Feed
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[70vh] items-start justify-center px-4 py-12">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Share Your Truth</h1>
                    <p className="text-muted-foreground text-sm">
                        Your confession will be posted completely anonymously.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="space-y-2">
                        <label htmlFor="confession-content" className="text-sm font-medium sr-only">
                            Your confession
                        </label>
                        <div className="relative">
                            <textarea
                                id="confession-content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                maxLength={MAX_CHARS}
                                rows={8}
                                placeholder="I've never told anyone this, but..."
                                required
                                className="w-full rounded-xl border border-input bg-card px-4 py-4 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none leading-relaxed"
                            />
                        </div>

                        {/* Character Counter */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                {content.trim().length < MIN_CHARS && content.length > 0
                                    ? <span className="text-destructive">Minimum {MIN_CHARS} characters</span>
                                    : <span className="text-muted-foreground/60">Be honest. Be you.</span>
                                }
                            </span>
                            <span className={remaining < 100 ? (remaining < 20 ? 'text-destructive font-medium' : 'text-amber-500') : 'text-muted-foreground'}>
                                {remaining} / {MAX_CHARS}
                            </span>
                        </div>
                    </div>

                    {/* Anonymous reminder */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Your identity is completely hidden. Only &ldquo;Anonymous&rdquo; will be shown.</span>
                    </div>

                    {/* Submit */}
                    <button
                        id="post-confession-submit-btn"
                        type="submit"
                        disabled={loading || !isValid}
                        className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Posting...</>
                        ) : (
                            <><Heart className="h-4 w-4" /> Post Anonymously</>
                        )}
                    </button>
                </form>

                {/* Rules */}
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community Rules</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        <li>Max 5 confessions per day</li>
                        <li>No hate speech, harassment, or harmful content</li>
                        <li>Text only — no links or media</li>
                        <li>Repeated violations may result in account suspension</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
