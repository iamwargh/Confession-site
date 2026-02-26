'use client'

/**
 * HOME FEED CLIENT — AI-12 (Claude Sonnet 4.6)
 * Handles infinite scroll, empty states, loading states.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConfessionCard } from '@/components/feed/ConfessionCard'
import { Heart, Loader2, TrendingUp, PenLine } from 'lucide-react'
import Link from 'next/link'

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
    isLoggedIn: boolean
    pageSize: number
}

export function HomeFeedClient({ initialConfessions, userLikes, userReports, isLoggedIn, pageSize }: Props) {
    const [confessions, setConfessions] = useState<Confession[]>(initialConfessions)
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set(userLikes))
    const [reportedIds, setReportedIds] = useState<Set<string>>(new Set(userReports))
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialConfessions.length === pageSize)
    const [page, setPage] = useState(1)
    const loaderRef = useRef<HTMLDivElement>(null)

    // Infinite scroll via Intersection Observer
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return
        setLoading(true)

        const supabase = createClient()
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data: newConfessions } = await supabase
            .from('confessions')
            .select('id, content, likes_count, comments_count, created_at')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (!newConfessions || newConfessions.length < pageSize) {
            setHasMore(false)
        }

        if (newConfessions && newConfessions.length > 0) {
            setConfessions(prev => [...prev, ...newConfessions])
            setPage(prev => prev + 1)

            // Fetch likes for new confessions if logged in
            // (done client-side for simplicity)
        }

        setLoading(false)
    }, [loading, hasMore, page, pageSize])

    useEffect(() => {
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
    }, [loadMore])

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Hero */}
                <div className="text-center space-y-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Heart className="h-6 w-6 text-primary fill-current" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            OffChest
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Anonymous confessions. Real feelings. A safe space for your truth.
                    </p>

                    {/* CTA */}
                    {isLoggedIn ? (
                        <Link href="/post">
                            <button
                                id="hero-confess-btn"
                                className="mt-2 inline-flex items-center gap-2 h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                <PenLine className="h-3.5 w-3.5" />
                                Share your truth
                            </button>
                        </Link>
                    ) : (
                        <div className="flex gap-2 justify-center mt-2">
                            <Link href="/signup">
                                <button className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                                    Join anonymously
                                </button>
                            </Link>
                            <Link href="/login">
                                <button className="h-10 px-6 rounded-full border border-border text-sm font-medium hover:bg-accent transition-colors">
                                    Login
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Feed Nav */}
                <div className="flex items-center gap-1 border-b border-border/60 pb-3">
                    <button className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        Latest
                    </button>
                    <Link href="/trending">
                        <button className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Trending
                        </button>
                    </Link>
                </div>

                {/* Confessions List */}
                {confessions.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <Heart className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h2 className="text-xl font-semibold">No confessions yet</h2>
                        <p className="text-muted-foreground text-sm">Be the first to share your truth.</p>
                        {isLoggedIn && (
                            <Link href="/post">
                                <button className="mt-2 h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                                    Post first confession
                                </button>
                            </Link>
                        )}
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
