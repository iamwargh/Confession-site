/**
 * HOME FEED — AI-12 (Claude Sonnet 4.6)
 * Server component: fetches latest confessions from Supabase.
 * Client component handles infinite scroll.
 */

import { createClient } from '@/lib/supabase/server'
import { HomeFeedClient } from './home-feed-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'OffChest — Anonymous Confessions',
  description: 'Read real anonymous confessions. Share your own secrets safely and anonymously.',
}

const PAGE_SIZE = 10

export default async function HomePage() {
  const supabase = await createClient()

  // Get current user (for like status)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch first page of confessions
  const { data: confessions, error } = await supabase
    .from('confessions')
    .select('id, content, likes_count, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  // Get user's likes for the first page (optimistic UI)
  let userLikes: string[] = []
  let userReports: string[] = []
  if (user && confessions && confessions.length > 0) {
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
    <HomeFeedClient
      initialConfessions={confessions ?? []}
      userLikes={userLikes}
      userReports={userReports}
      isLoggedIn={!!user}
      pageSize={PAGE_SIZE}
    />
  )
}
