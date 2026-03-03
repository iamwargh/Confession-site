/**
 * CONFESSION DETAIL PAGE — Single confession view with real Supabase data.
 */
import { createClient } from '@/lib/supabase/server'
import { ConfessionCard } from '@/components/feed/ConfessionCard'
import { CommentSection } from '@/components/feed/CommentSection'
import { MentalHealthBannerWrapper } from './mental-health-banner'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { AdultGateClient } from './adult-gate-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase
        .from('confessions')
        .select('content')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

    return {
        title: data
            ? `"${data.content.slice(0, 60)}..." — OffChest`
            : 'Confession — OffChest',
        description: data?.content.slice(0, 155) ?? 'Read anonymous confessions on OffChest.',
    }
}

export default async function ConfessionDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: confession } = await supabase
        .from('confessions')
        .select('id, content, likes_count, comments_count, created_at, user_id, is_adult')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

    if (!confession) notFound()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (confession.is_adult && !user) {
        redirect(`/login?next=/confession/${id}`)
    }
    let currentUserLiked = false
    let reportedByUser = false
    let isOwner = false
    let isAdmin = false

    if (user) {
        isOwner = user.id === confession.user_id

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

        const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('confession_id', id)
            .single()
        currentUserLiked = !!like

        const { data: report } = await supabase
            .from('reports')
            .select('id')
            .eq('reported_by', user.id)
            .eq('confession_id', id)
            .single()
        reportedByUser = !!report
    }

    const contentNode = (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Link
                    href={confession.is_adult ? "/18-plus" : "/"}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to feed
                </Link>

                <ConfessionCard
                    id={confession.id}
                    content={confession.content}
                    likesCount={confession.likes_count}
                    commentsCount={confession.comments_count}
                    createdAt={confession.created_at}
                    currentUserLiked={currentUserLiked}
                    reportedByUser={reportedByUser}
                    isOwner={isOwner}
                    isAdmin={isAdmin}
                />

                {/* Mental health support banner for reader */}
                <MentalHealthBannerWrapper content={confession.content} />

                <CommentSection confessionId={id} isLoggedIn={!!user} />
            </div>
        </div>
    )

    if (confession.is_adult) {
        return <AdultGateClient>{contentNode}</AdultGateClient>
    }

    return contentNode
}
