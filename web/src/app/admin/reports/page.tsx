/**
 * ADMIN REPORTS QUEUE — AI-23 (Claude Sonnet 4.6)
 * Lists all pending reports. Each: confession text, reason, reporter.
 * Actions: dismiss / delete post / lock user.
 * Server component with client action handlers.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminReportsClient } from './reports-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Reports Queue — Admin | Truth of Your Heart',
}

export default async function AdminReportsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        redirect('/')
    }

    // Fetch all pending reports with confession + reporter info
    const { data: reports } = await supabase
        .from('reports')
        .select(`
            id,
            reason,
            details,
            status,
            created_at,
            confession:confessions!reports_confession_id_fkey(id, content, user_id),
            reporter:profiles!reports_reported_by_fkey(username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    // Supabase returns joined relations as arrays — flatten to single objects
    const normalizedReports = (reports ?? []).map((r: any) => ({
        ...r,
        confession: Array.isArray(r.confession) ? r.confession[0] ?? null : r.confession ?? null,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] ?? null : r.reporter ?? null,
    }))

    return <AdminReportsClient reports={normalizedReports} adminRole={profile.role} adminId={user.id} />
}
