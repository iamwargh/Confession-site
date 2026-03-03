import { createClient } from '@/lib/supabase/server'
import { AdultFeedClient } from './adult-feed-client'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '18+ Confessions — OffChest',
    description: 'Adult explicit anonymous confessions.',
}

const PAGE_SIZE = 10

export default async function AdultHomePage() {
    const supabase = await createClient()

    // Get current user, MUST be logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/18-plus')
    }

    // Fetch first page of 18+ confessions
    const { data: confessions, error } = await supabase
        .from('confessions')
        .select('id, content, likes_count, comments_count, created_at')
        .eq('is_deleted', false)
        .eq('is_adult', true)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

    // Get user's likes for the first page (optimistic UI)
    let userLikes: string[] = []
    let userReports: string[] = []
    if (confessions && confessions.length > 0) {
        const ids = confessions.map(c => c.id)
        const { data: likes } = await supabase
            .from('likes')
            .select('confession_id')
            .eq('user_id', user.id)
            .in('confession_id', ids)
        userLikes = (likes ?? []).map(l => l.confession_id)

        const { data: reports } = await supabase
            .from('reports')
            .select('confession_id')
            .eq('reported_by', user.id)
            .in('confession_id', ids)
        userReports = (reports ?? []).map(r => r.confession_id)
    }

    return (
        <AdultFeedClient
            initialConfessions={confessions ?? []}
            userLikes={userLikes}
            userReports={userReports}
            pageSize={PAGE_SIZE}
            userEmail={user.email ?? ''}
        />
    )
}
