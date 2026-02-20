import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminDashboardClient } from './dashboard-client'

/**
 * SUPER ADMIN DASHBOARD — AI-25 (Claude Opus 4.6)
 * 
 * Server Component that fetches all dashboard data.
 * Passes data to client component for rendering.
 */

export const dynamic = 'force-dynamic'

interface DashboardStats {
    totalUsers: number
    usersToday: number
    usersThisWeek: number
    totalConfessions: number
    confessionsToday: number
    confessionsThisWeek: number
    totalReports: number
    pendingReports: number
    resolvedReports: number
    totalAdmins: number
    suspendedAccounts: number
    bannedAccounts: number
}

interface RecentUser {
    id: string
    username: string
    email: string
    role: string
    created_at: string
}

interface RecentPost {
    id: string
    content: string
    likes_count: number
    created_at: string
}

interface AdminInfo {
    id: string
    username: string
    email: string
    role: string
    created_at: string
}

interface SuspendedUser {
    id: string
    username: string
    email: string
    is_suspended: boolean
    suspended_until: string | null
    suspension_reason: string | null
}

export default async function SuperAdminDashboardPage() {
    const supabase = await createClient()

    // Verify superadmin access (belt + suspenders with middleware)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') redirect('/')

    // ── Fetch all dashboard data in parallel ──
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)
    const weekAgoISO = weekAgo.toISOString()

    const [
        totalUsersRes,
        usersTodayRes,
        usersThisWeekRes,
        totalConfessionsRes,
        confessionsTodayRes,
        confessionsThisWeekRes,
        totalReportsRes,
        pendingReportsRes,
        resolvedReportsRes,
        adminsRes,
        suspendedRes,
        bannedRes,
        recentUsersRes,
        recentPostsRes,
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoISO),
        supabase.from('confessions').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('confessions').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gte('created_at', todayISO),
        supabase.from('confessions').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gte('created_at', weekAgoISO),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).in('status', ['resolved', 'dismissed']),
        supabase.from('profiles').select('id, username, email, role, created_at').in('role', ['admin', 'superadmin']).order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, username, email, is_suspended, suspended_until, suspension_reason').eq('is_suspended', true).not('suspended_until', 'is', null),
        supabase.from('profiles').select('id, username, email, is_suspended, suspended_until, suspension_reason').eq('is_suspended', true).is('suspended_until', null),
        supabase.from('profiles').select('id, username, email, role, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('confessions').select('id, content, likes_count, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(10),
    ])

    const stats: DashboardStats = {
        totalUsers: totalUsersRes.count ?? 0,
        usersToday: usersTodayRes.count ?? 0,
        usersThisWeek: usersThisWeekRes.count ?? 0,
        totalConfessions: totalConfessionsRes.count ?? 0,
        confessionsToday: confessionsTodayRes.count ?? 0,
        confessionsThisWeek: confessionsThisWeekRes.count ?? 0,
        totalReports: totalReportsRes.count ?? 0,
        pendingReports: pendingReportsRes.count ?? 0,
        resolvedReports: resolvedReportsRes.count ?? 0,
        totalAdmins: adminsRes.data?.length ?? 0,
        suspendedAccounts: (suspendedRes.count ?? 0) + (bannedRes.count ?? 0),
        bannedAccounts: bannedRes.data?.length ?? 0,
    }

    return (
        <SuperAdminDashboardClient
            stats={stats}
            admins={(adminsRes.data ?? []) as AdminInfo[]}
            suspendedUsers={(suspendedRes.data ?? []) as SuspendedUser[]}
            bannedUsers={(bannedRes.data ?? []) as SuspendedUser[]}
            recentUsers={(recentUsersRes.data ?? []) as RecentUser[]}
            recentPosts={(recentPostsRes.data ?? []) as RecentPost[]}
        />
    )
}
