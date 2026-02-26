/**
 * TRENDING PAGE — Real data from Supabase (top likes in last 7 days)
 */
import { createClient } from '@/lib/supabase/server'
import { ConfessionCard } from '@/components/feed/ConfessionCard'
import { TrendingUp, Flame } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
    title: 'Trending Confessions — OffChest',
    description: 'The most popular anonymous confessions this week.',
}

export default async function TrendingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Trending: most liked in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: confessions } = await supabase
        .from('confessions')
        .select('id, content, likes_count, comments_count, created_at')
        .eq('is_deleted', false)
        .gte('created_at', sevenDaysAgo)
        .order('likes_count', { ascending: false })
        .limit(20)

    // Get user likes
    let userLikes: string[] = []
    let userReports: string[] = []
    if (user && confessions && confessions.length > 0) {
        const ids = confessions.map(c => c.id)
        const { data: likes } = await supabase
            .from('likes').select('confession_id').eq('user_id', user.id).in('confession_id', ids)
        userLikes = (likes ?? []).map(l => l.confession_id)
        const { data: reports } = await supabase
            .from('reports').select('confession_id').eq('reported_by', user.id).in('confession_id', ids)
        userReports = (reports ?? []).map(r => r.confession_id)
    }

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Flame className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Trending</h1>
                            <p className="text-sm text-muted-foreground">Most liked confessions this week</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Latest
                    </Link>
                </div>

                {/* Confessions */}
                {!confessions || confessions.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30" />
                        <p className="text-muted-foreground text-sm">Nothing trending yet this week.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {confessions.map((c, i) => (
                            <div key={c.id} className="relative">
                                {i < 3 && (
                                    <span className="absolute -left-3 -top-2 z-10 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                        {i + 1}
                                    </span>
                                )}
                                <ConfessionCard
                                    id={c.id}
                                    content={c.content}
                                    likesCount={c.likes_count}
                                    commentsCount={c.comments_count}
                                    createdAt={c.created_at}
                                    currentUserLiked={userLikes.includes(c.id)}
                                    reportedByUser={userReports.includes(c.id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
