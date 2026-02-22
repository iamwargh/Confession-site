/**
 * MY CONFESSIONS PAGE — AI-17 (Claude Sonnet 4.6)
 * Shows user's own confessions with delete option. Real Supabase data.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConfessionCard } from '@/components/feed/ConfessionCard'
import { Heart, PenLine } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'My Confessions — OffChest',
    description: 'View and manage your anonymous confessions.',
}

export default async function MyConfessionsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?redirect=/my-confessions')

    const { data: confessions } = await supabase
        .from('confessions')
        .select('id, content, likes_count, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Heart className="h-5 w-5 text-primary fill-current" />
                            My Confessions
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your anonymous posts · {confessions?.length ?? 0} total
                        </p>
                    </div>
                    <Link href="/post">
                        <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                            <PenLine className="h-3.5 w-3.5" />
                            New
                        </button>
                    </Link>
                </div>

                {/* List */}
                {!confessions || confessions.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <Heart className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h2 className="text-xl font-semibold">No confessions yet</h2>
                        <p className="text-muted-foreground text-sm">Your soul has something to say.</p>
                        <Link href="/post">
                            <button className="mt-2 h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                                Write your first
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {confessions.map(c => (
                            <ConfessionCard
                                key={c.id}
                                id={c.id}
                                content={c.content}
                                likesCount={c.likes_count}
                                createdAt={c.created_at}
                                isOwner={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
