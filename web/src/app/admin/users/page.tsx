/**
 * ADMIN USERS PAGE — lists all users with lock/unlock actions.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './users-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
    title: 'Manage Users — Admin | OffChest',
}

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) redirect('/')

    const { data: users } = await supabase
        .from('profiles')
        .select('id, username, email, role, is_suspended, suspended_until, suspension_reason, created_at')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

    return <AdminUsersClient users={users ?? []} adminId={user.id} adminRole={profile.role} />
}
