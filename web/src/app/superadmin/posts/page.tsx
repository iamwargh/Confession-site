/**
 * SUPERADMIN POSTS PAGE — All confessions with delete. Real Supabase data.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminPostsClient } from './posts-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
    title: 'Post Management — Super Admin | Truth of Your Heart',
}

export default async function SuperAdminPostsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') redirect('/')

    const params = await searchParams
    const search = params.q || ''
    const page = parseInt(params.page || '1', 10)
    const pageSize = 20
    const from = (page - 1) * pageSize

    let query = supabase
        .from('confessions')
        .select('id, content, likes_count, created_at, is_deleted', { count: 'exact' })
        .eq('is_deleted', false)

    if (search) {
        query = query.ilike('content', `%${search}%`)
    }

    const { data: posts, count } = await query
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1)

    return (
        <SuperAdminPostsClient
            posts={posts ?? []}
            totalCount={count ?? 0}
            currentPage={page}
            pageSize={pageSize}
            searchQuery={search}
            adminId={user.id}
        />
    )
}
