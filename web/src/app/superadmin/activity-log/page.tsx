import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
    Activity, Shield, ShieldAlert, Trash2, Lock, Unlock,
    Ban, UserPlus, UserMinus, Flag, CheckCircle, XCircle
} from 'lucide-react'

/**
 * ACTIVITY LOG — AI-25 support (Claude Opus 4.6)
 * 
 * Shows which admin did what action, when, and to whom.
 * Only accessible by superadmins.
 */

export const dynamic = 'force-dynamic'

const ACTION_ICONS: Record<string, React.ElementType> = {
    delete_post: Trash2,
    lock_user: Lock,
    unlock_user: Unlock,
    suspend_user: Lock,
    unsuspend_user: Unlock,
    ban_user: Ban,
    delete_account: Trash2,
    promote_to_admin: UserPlus,
    demote_from_admin: UserMinus,
    resolve_report: CheckCircle,
    dismiss_report: XCircle,
}

const ACTION_COLORS: Record<string, string> = {
    delete_post: 'text-red-400',
    lock_user: 'text-amber-400',
    unlock_user: 'text-green-400',
    suspend_user: 'text-amber-400',
    unsuspend_user: 'text-green-400',
    ban_user: 'text-red-400',
    delete_account: 'text-red-400',
    promote_to_admin: 'text-blue-400',
    demote_from_admin: 'text-zinc-400',
    resolve_report: 'text-green-400',
    dismiss_report: 'text-zinc-400',
}

const ACTION_LABELS: Record<string, string> = {
    delete_post: 'Deleted Post',
    lock_user: 'Locked User',
    unlock_user: 'Unlocked User',
    suspend_user: 'Suspended User',
    unsuspend_user: 'Unsuspended User',
    ban_user: 'Banned User',
    delete_account: 'Deleted Account',
    promote_to_admin: 'Promoted to Admin',
    demote_from_admin: 'Demoted from Admin',
    resolve_report: 'Resolved Report',
    dismiss_report: 'Dismissed Report',
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

export default async function ActivityLogPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') redirect('/')

    // Fetch activity log with admin info
    const { data: actions } = await supabase
        .from('admin_actions')
        .select(`
      id,
      action_type,
      notes,
      metadata,
      created_at,
      admin:profiles!admin_actions_admin_id_fkey(username, role),
      target_user:profiles!admin_actions_target_user_id_fkey(username)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    // Normalize Supabase joined relations (arrays → single objects)
    const normalizedActions = (actions ?? []).map((a: any) => ({
        ...a,
        admin: Array.isArray(a.admin) ? a.admin[0] ?? null : a.admin ?? null,
        target_user: Array.isArray(a.target_user) ? a.target_user[0] ?? null : a.target_user ?? null,
    }))
    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Activity className="h-8 w-8 text-purple-400" />
                    Activity Log
                </h1>
                <p className="text-muted-foreground mt-1">All admin actions are recorded here</p>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
                {!normalizedActions || normalizedActions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No admin actions recorded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {normalizedActions.map((action: any) => {
                            const Icon = ACTION_ICONS[action.action_type] || Activity
                            const color = ACTION_COLORS[action.action_type] || 'text-muted-foreground'
                            const label = ACTION_LABELS[action.action_type] || action.action_type

                            return (
                                <div key={action.id} className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors">
                                    <div className={`mt-0.5 h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-semibold ${color}`}>{label}</span>
                                            <span className="text-sm text-muted-foreground">by</span>
                                            <span className="text-sm font-medium flex items-center gap-1">
                                                {action.admin?.role === 'superadmin' ? (
                                                    <ShieldAlert className="h-3 w-3 text-red-400" />
                                                ) : (
                                                    <Shield className="h-3 w-3 text-blue-400" />
                                                )}
                                                {action.admin?.username || 'Unknown'}
                                            </span>
                                            {action.target_user && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">→</span>
                                                    <span className="text-sm font-medium">{action.target_user.username}</span>
                                                </>
                                            )}
                                        </div>
                                        {action.notes && (
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{action.notes}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(action.created_at)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
