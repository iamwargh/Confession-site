/**
 * ADMIN DASHBOARD — AI-22 (Claude Sonnet 4.6)
 * Stats: total reports (pending/resolved), recent reported posts, locked accounts, quick actions.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, Flag, Lock, AlertCircle, CheckCircle, FileText, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Admin Dashboard — OffChest',
}

export default async function AdminDashboardPage() {
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

    // Stats queries in parallel
    const [
        { count: pendingReports },
        { count: resolvedReports },
        { count: lockedUsers },
        { data: recentReports },
    ] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).neq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
        supabase
            .from('reports')
            .select(`
                id, reason, status, created_at,
                confession:confessions!reports_confession_id_fkey(id, content)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    const stats = [
        {
            label: 'Pending Reports',
            value: pendingReports ?? 0,
            icon: Flag,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            href: '/admin/reports',
        },
        {
            label: 'Resolved Reports',
            value: resolvedReports ?? 0,
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            href: '/admin/reports',
        },
        {
            label: 'Locked Accounts',
            value: lockedUsers ?? 0,
            icon: Lock,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            href: '/admin/users',
        },
    ]

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Content moderation & user management</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.map(stat => {
                        const Icon = stat.icon
                        return (
                            <Link key={stat.label} href={stat.href}>
                                <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                            <Icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                        <span className="text-2xl font-bold">{stat.value}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        {stat.label}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href="/admin/reports">
                        <div className="rounded-xl border border-border bg-card p-4 hover:border-amber-500/30 hover:shadow-sm transition-all flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Flag className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Review Reports</p>
                                <p className="text-xs text-muted-foreground">{pendingReports ?? 0} pending</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/admin/users">
                        <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Manage Users</p>
                                <p className="text-xs text-muted-foreground">Lock, view profiles</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Pending Reports */}
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between p-4 border-b border-border/60">
                        <h2 className="font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Recent Pending Reports
                        </h2>
                        <Link href="/admin/reports" className="text-xs text-primary hover:underline font-medium">
                            View all →
                        </Link>
                    </div>

                    {!recentReports || recentReports.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                            No pending reports — you&apos;re all caught up!
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {recentReports.map((report: any) => (
                                <div key={report.id} className="p-4 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize">
                                            {report.reason.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(report.created_at).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {(report.confession as any)?.content ?? 'Confession deleted'}
                                    </p>
                                    <Link
                                        href="/admin/reports"
                                        className="inline-block text-xs text-primary hover:underline font-medium"
                                    >
                                        Review →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
