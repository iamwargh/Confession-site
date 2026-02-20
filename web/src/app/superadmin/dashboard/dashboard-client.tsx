'use client'

import {
    Users, MessageSquare, Flag, Shield, ShieldAlert, ShieldCheck,
    Clock, TrendingUp, UserX, Ban, Activity, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

/**
 * SUPER ADMIN DASHBOARD CLIENT — AI-25 (Claude Opus 4.6)
 * 
 * The visual heart of the Super Admin panel.
 * All data is passed in from the server component.
 */

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

interface Props {
    stats: DashboardStats
    admins: AdminInfo[]
    suspendedUsers: SuspendedUser[]
    bannedUsers: SuspendedUser[]
    recentUsers: RecentUser[]
    recentPosts: RecentPost[]
}

function StatCard({ title, value, subtitle, icon: Icon, color, link }: {
    title: string
    value: number | string
    subtitle?: string
    icon: React.ElementType
    color: string
    link?: string
}) {
    const card = (
        <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-border/80 ${link ? 'cursor-pointer' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
            {link && (
                <div className="absolute bottom-2 right-3">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
            )}
        </div>
    )

    return link ? <Link href={link}>{card}</Link> : card
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatTimeAgo(dateStr: string) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
}

function getRoleBadge(role: string) {
    switch (role) {
        case 'superadmin':
            return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><ShieldAlert className="h-3 w-3" /> Super</span>
        case 'admin':
            return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Shield className="h-3 w-3" /> Admin</span>
        default:
            return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">User</span>
    }
}

export function SuperAdminDashboardClient({ stats, admins, suspendedUsers, bannedUsers, recentUsers, recentPosts }: Props) {
    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                        Super Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Full platform overview and controls</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/superadmin/users" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                        <Users className="h-4 w-4" /> Manage Users
                    </Link>
                    <Link href="/superadmin/activity-log" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                        <Activity className="h-4 w-4" /> Activity Log
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle={`+${stats.usersToday} today · +${stats.usersThisWeek} this week`}
                    icon={Users}
                    color="bg-blue-500"
                    link="/superadmin/users"
                />
                <StatCard
                    title="Total Confessions"
                    value={stats.totalConfessions}
                    subtitle={`+${stats.confessionsToday} today · +${stats.confessionsThisWeek} this week`}
                    icon={MessageSquare}
                    color="bg-purple-500"
                    link="/superadmin/posts"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    subtitle={`${stats.resolvedReports} resolved · ${stats.totalReports} total`}
                    icon={Flag}
                    color={stats.pendingReports > 0 ? "bg-red-500" : "bg-green-500"}
                    link="/superadmin/reports"
                />
                <StatCard
                    title="Admins"
                    value={stats.totalAdmins}
                    subtitle={`${stats.suspendedAccounts} suspended · ${stats.bannedAccounts} banned`}
                    icon={ShieldCheck}
                    color="bg-amber-500"
                    link="/superadmin/admins"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Signups */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-400" />
                            Recent Signups
                        </h2>
                        <Link href="/superadmin/users" className="text-sm text-primary hover:underline">View all →</Link>
                    </div>
                    <div className="divide-y divide-border">
                        {recentUsers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No users yet</div>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">{user.username[0]?.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getRoleBadge(user.role)}
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(user.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Admin List */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-amber-400" />
                            Admins
                        </h2>
                        <Link href="/superadmin/admins" className="text-sm text-primary hover:underline">Manage →</Link>
                    </div>
                    <div className="divide-y divide-border">
                        {admins.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No admins assigned</div>
                        ) : (
                            admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="text-sm font-medium">{admin.username}</p>
                                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                                    </div>
                                    {getRoleBadge(admin.role)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Posts */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-purple-400" />
                            Recent Confessions
                        </h2>
                        <Link href="/superadmin/posts" className="text-sm text-primary hover:underline">View all →</Link>
                    </div>
                    <div className="divide-y divide-border">
                        {recentPosts.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No confessions yet</div>
                        ) : (
                            recentPosts.slice(0, 5).map((post) => (
                                <div key={post.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <p className="text-sm text-foreground/80 line-clamp-2">{post.content}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs text-muted-foreground">❤️ {post.likes_count}</span>
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Suspended & Banned */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="p-5 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <UserX className="h-5 w-5 text-red-400" />
                            Suspended & Banned Accounts
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {bannedUsers.length === 0 && suspendedUsers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No suspended or banned accounts</div>
                        ) : (
                            <>
                                {bannedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-sm font-medium">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">{user.suspension_reason || 'Banned'}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                            <Ban className="h-3 w-3" /> Banned
                                        </span>
                                    </div>
                                ))}
                                {suspendedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-sm font-medium">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Until: {user.suspended_until ? formatDate(user.suspended_until) : 'Unknown'}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            <Clock className="h-3 w-3" /> Suspended
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
