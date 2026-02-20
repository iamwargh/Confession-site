/**
 * SUPERADMIN PROMOTE/DEMOTE PAGE — AI-27 (Claude Sonnet 4.6)
 * Lists all admins + regular users. Allows role changes: user ↔ admin.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PromoteDemoteClient } from './promote-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Promote/Demote Admins — Super Admin | Truth of Your Heart',
}

export default async function PromoteDemotePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') redirect('/')

    // Get all users except superadmins
    const { data: users } = await supabase
        .from('profiles')
        .select('id, username, email, role, created_at')
        .neq('role', 'superadmin')
        .order('role', { ascending: false }) // admins first
        .order('created_at', { ascending: false })
        .limit(100)

    return <PromoteDemoteClient users={users ?? []} currentUserId={user.id} />
}
