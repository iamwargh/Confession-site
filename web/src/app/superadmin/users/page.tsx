import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTableClient } from './users-client'

/**
 * SUPER ADMIN — FULL USER TABLE — AI-26 (Claude Opus 4.6)
 * 
 * Server Component: fetches user list for the super admin user management page.
 */

export const dynamic = 'force-dynamic'

export default async function SuperAdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>
}) {
    const supabase = await createClient()

    // Verify superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') redirect('/')

    const params = await searchParams
    const searchQuery = params.q || ''
    const roleFilter = params.role || 'all'
    const statusFilter = params.status || 'all'
    const page = parseInt(params.page || '1', 10)
    const pageSize = 20

    // Build query
    let query = supabase
        .from('profiles')
        .select('id, username, email, role, is_verified, is_suspended, suspended_until, suspension_reason, created_at', { count: 'exact' })

    // Apply search filter
    if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    // Apply role filter
    if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
    }

    // Apply status filter
    if (statusFilter === 'suspended') {
        query = query.eq('is_suspended', true)
    } else if (statusFilter === 'active') {
        query = query.eq('is_suspended', false)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data: users, count } = await query

    return (
        <UsersTableClient
            users={users ?? []}
            totalCount={count ?? 0}
            currentPage={page}
            pageSize={pageSize}
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
        />
    )
}
