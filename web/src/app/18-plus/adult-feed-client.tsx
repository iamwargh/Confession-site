'use client'

/**
 * 18+ FEED CLIENT
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConfessionCard } from '@/components/feed/ConfessionCard'
import { Heart, Loader2, TrendingUp, PenLine, Flame, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Confession {
    id: string
    content: string
    likes_count: number
    comments_count: number
    created_at: string
}

interface Props {
    initialConfessions: Confession[]
    userLikes: string[]
    userReports: string[]
    pageSize: number
    userEmail?: string
}

export function AdultFeedClient({ initialConfessions, userLikes, userReports, pageSize, userEmail }: Props) {
    const [isVerified18Plus, setIsVerified18Plus] = useState(false)
    const [confessions, setConfessions] = useState<Confession[]>(initialConfessions)
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set(userLikes))
    const [reportedIds, setReportedIds] = useState<Set<string>>(new Set(userReports))
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialConfessions.length === pageSize)
    const [page, setPage] = useState(1)
    const loaderRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Infinite scroll
    const loadMore = useCallback(async () => {
        if (loading || !hasMore || !isVerified18Plus) return
        setLoading(true)

        const supabase = createClient()
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data: newConfessions } = await supabase
            .from('confessions')
            .select('id, content, likes_count, comments_count, created_at')
            .eq('is_deleted', false)
            .eq('is_adult', true)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (!newConfessions || newConfessions.length < pageSize) {
            setHasMore(false)
        }

        if (newConfessions && newConfessions.length > 0) {
            setConfessions(prev => [...prev, ...newConfessions])
            setPage(prev => prev + 1)
        }

        setLoading(false)
    }, [loading, hasMore, page, pageSize, isVerified18Plus])

    useEffect(() => {
        if (!isVerified18Plus) return
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )
        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [loadMore, isVerified18Plus])

    // Render the Age Verification Popup
    if (!isVerified18Plus) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-card border border-rose-500/30 shadow-2xl rounded-2xl p-6 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Age Verification</h2>
                        <p className="text-sm text-muted-foreground">
                            This section contains explicit (18+) content including strong language and adult themes.
                            Are you 18 years of age or older?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={() => router.push('/')}
                            className="h-12 w-full rounded-xl border border-border bg-background hover:bg-accent hover:text-foreground font-medium transition-colors"
                        >
                            No, go back
                        </button>
                        <button
                            onClick={() => setIsVerified18Plus(true)}
                            className="h-12 w-full rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-md shadow-rose-900/20"
                        >
                            Yes, I am 18+
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Hero */}
                <div className="text-center space-y-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Flame className="h-6 w-6 text-rose-500 fill-rose-500/20" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            18+ Confessions
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Raw, unfiltered adult confessions. What happens here, stays here.
                    </p>

                    {/* CTA */}
                    <Link href="/post">
                        <button
                            id="hero-confess-btn"
                            className="mt-2 inline-flex items-center gap-2 h-10 px-6 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            <PenLine className="h-3.5 w-3.5" />
                            Share your truth
                        </button>
                    </Link>
                </div>

                {/* Feed Nav */}
                <div className="flex items-center gap-1 border-b border-border/60 pb-3">
                    <Link href="/">
                        <button className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            General feed
                        </button>
                    </Link>
                    <button className="px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center gap-1.5 ">
                        <Flame className="h-3.5 w-3.5" />
                        18+ Latest
                    </button>
                </div>

                {/* Confessions List */}
                {confessions.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <Flame className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h2 className="text-xl font-semibold">No confessions yet</h2>
                        <p className="text-muted-foreground text-sm">Be the first to share an 18+ confession.</p>
                        <Link href="/post">
                            <button className="mt-2 h-10 px-6 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                                Post a confession
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {confessions.map(confession => (
                            <ConfessionCard
                                key={confession.id}
                                id={confession.id}
                                content={confession.content}
                                likesCount={confession.likes_count}
                                commentsCount={confession.comments_count}
                                createdAt={confession.created_at}
                                currentUserLiked={likedIds.has(confession.id)}
                                reportedByUser={reportedIds.has(confession.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="py-4 flex justify-center">
                    {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    {!hasMore && confessions.length > 0 && (
                        <p className="text-xs text-muted-foreground/60">You&apos;ve seen everything ✨</p>
                    )}
                </div>
            </div>
        </div>
    )
}
