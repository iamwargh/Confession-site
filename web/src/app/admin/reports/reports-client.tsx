'use client'

/**
 * ADMIN REPORTS CLIENT — AI-23 (Claude Sonnet 4.6)
 * Interactive report management: dismiss, delete post, lock user.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { lockUser, type LockDuration } from '@/lib/actions/admin-lock'
import { Flag, Trash2, Lock, CheckCircle, XCircle, Shield, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Report {
    id: string
    reason: string
    details: string | null
    status: string
    created_at: string
    confession: { id: string; content: string; user_id: string } | null
    reporter: { username: string } | null
}

interface Props {
    reports: Report[]
    adminRole: string
    adminId: string
}

const REASON_LABELS: Record<string, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    self_harm: 'Self-Harm',
    misinformation: 'Misinformation',
    other: 'Other',
}

export function AdminReportsClient({ reports: initialReports, adminRole, adminId }: Props) {
    const [reports, setReports] = useState<Report[]>(initialReports)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [errorMap, setErrorMap] = useState<Record<string, string>>({})
    const [lockModal, setLockModal] = useState<{ reportId: string; userId: string } | null>(null)
    const [lockDuration, setLockDuration] = useState<LockDuration>('1d')
    const [lockReason, setLockReason] = useState('')
    const [lockLoading, setLockLoading] = useState(false)

    function setError(reportId: string, msg: string) {
        setErrorMap(prev => ({ ...prev, [reportId]: msg }))
    }

    function removeReport(reportId: string) {
        setReports(prev => prev.filter(r => r.id !== reportId))
    }

    // Dismiss report (mark as dismissed)
    async function handleDismiss(report: Report) {
        setProcessingId(report.id)
        const supabase = createClient()
        const { error } = await supabase
            .from('reports')
            .update({ status: 'dismissed', resolved_by: adminId })
            .eq('id', report.id)

        if (error) {
            setError(report.id, 'Failed to dismiss report.')
        } else {
            // Log admin action
            await supabase.from('admin_actions').insert({
                admin_id: adminId,
                action_type: 'dismiss_report',
                notes: `Dismissed report ${report.id} (${report.reason})`,
            })
            removeReport(report.id)
        }
        setProcessingId(null)
    }

    // Delete confession
    async function handleDeletePost(report: Report) {
        if (!report.confession) return
        if (!confirm('Delete this confession? This cannot be undone.')) return
        setProcessingId(report.id)
        const supabase = createClient()

        const { error } = await supabase
            .from('confessions')
            .update({ is_deleted: true, deleted_by: adminId })
            .eq('id', report.confession.id)

        if (error) {
            setError(report.id, 'Failed to delete confession.')
        } else {
            // Resolve the report
            await supabase
                .from('reports')
                .update({ status: 'resolved', resolved_by: adminId })
                .eq('id', report.id)

            // Log action
            await supabase.from('admin_actions').insert({
                admin_id: adminId,
                action_type: 'delete_post',
                target_confession_id: report.confession.id,
                notes: `Deleted confession via report ${report.id}. Reason: ${report.reason}`,
            })
            removeReport(report.id)
        }
        setProcessingId(null)
    }

    // Lock user
    async function handleLockUser() {
        if (!lockModal) return
        setLockLoading(true)

        const result = await lockUser(lockModal.userId, lockDuration, lockReason || `Locked following report`)

        if (!result.success) {
            setError(lockModal.reportId, result.error || 'Failed to lock user.')
        } else {
            // Resolve the report too
            const supabase = createClient()
            await supabase
                .from('reports')
                .update({ status: 'resolved', resolved_by: adminId })
                .eq('id', lockModal.reportId)
            removeReport(lockModal.reportId)
        }

        setLockModal(null)
        setLockLoading(false)
    }

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Flag className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports Queue</h1>
                        <p className="text-sm text-muted-foreground">
                            {reports.length} pending {reports.length === 1 ? 'report' : 'reports'}
                        </p>
                    </div>
                    <Link href="/admin/dashboard" className="ml-auto text-sm text-primary hover:underline font-medium">
                        ← Dashboard
                    </Link>
                </div>

                {/* Empty state */}
                {reports.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 opacity-50" />
                        <h2 className="font-semibold">All clear!</h2>
                        <p className="text-sm text-muted-foreground">No pending reports to review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                                {/* Report header */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            {REASON_LABELS[report.reason] || report.reason}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            by @{report.reporter?.username ?? 'unknown'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(report.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Confession content */}
                                {report.confession ? (
                                    <div className="rounded-lg bg-muted/40 p-4">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                                            Reported Confession
                                        </p>
                                        <p className="text-sm leading-relaxed line-clamp-4">
                                            {report.confession.content}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground italic">
                                        Confession has been deleted.
                                    </div>
                                )}

                                {/* Reporter's details */}
                                {report.details && (
                                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                                        <span className="font-medium">Details:</span> {report.details}
                                    </p>
                                )}

                                {/* Error */}
                                {errorMap[report.id] && (
                                    <div className="flex items-center gap-2 text-destructive text-xs">
                                        <XCircle className="h-3.5 w-3.5" />
                                        {errorMap[report.id]}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                                    <span className="text-xs text-muted-foreground font-medium mr-2">Actions:</span>

                                    {/* Dismiss */}
                                    <button
                                        onClick={() => handleDismiss(report)}
                                        disabled={processingId === report.id}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
                                    >
                                        {processingId === report.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <XCircle className="h-3 w-3 text-muted-foreground" />
                                        )}
                                        Dismiss
                                    </button>

                                    {/* Delete Post */}
                                    {report.confession && (
                                        <button
                                            onClick={() => handleDeletePost(report)}
                                            disabled={processingId === report.id}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete Post
                                        </button>
                                    )}

                                    {/* Lock User */}
                                    {report.confession && (
                                        <button
                                            onClick={() => setLockModal({
                                                reportId: report.id,
                                                userId: report.confession!.user_id
                                            })}
                                            disabled={processingId === report.id}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                        >
                                            <Lock className="h-3 w-3" />
                                            Lock User
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lock User Modal */}
            {lockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-500" />
                            <h3 className="font-semibold">Lock User Account</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Lock Duration</label>
                                <select
                                    value={lockDuration}
                                    onChange={e => setLockDuration(e.target.value as LockDuration)}
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="1d">1 Day</option>
                                    <option value="3d">3 Days</option>
                                    <option value="7d">7 Days</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Reason (optional)</label>
                                <input
                                    type="text"
                                    value={lockReason}
                                    onChange={e => setLockReason(e.target.value)}
                                    placeholder="Reason for lock..."
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setLockModal(null)}
                                className="flex-1 h-9 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLockUser}
                                disabled={lockLoading}
                                className="flex-1 h-9 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-500/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {lockLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                                Lock Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
