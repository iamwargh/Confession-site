'use client'

/**
 * CONFESSION CARD — AI-12, AI-15, AI-16 (Claude Sonnet 4.6)
 * Interactive card: Like/Unlike (optimistic), Report modal, Delete
 */

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Flag, Trash2, Clock, MessageCircle } from 'lucide-react'
import { toggleLike, deleteConfession, reportConfession, type ReportReason } from '@/lib/actions/confessions'
import { cn } from '@/lib/utils'

interface ConfessionCardProps {
    id: string
    content: string
    likesCount: number
    commentsCount?: number
    createdAt: string
    isOwner?: boolean
    isAdmin?: boolean
    currentUserLiked?: boolean
    reportedByUser?: boolean
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'self_harm', label: 'Self-harm or suicide' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'other', label: 'Other' },
]

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function ConfessionCard({
    id,
    content,
    likesCount,
    commentsCount = 0,
    createdAt,
    isOwner,
    isAdmin,
    currentUserLiked = false,
    reportedByUser = false,
}: ConfessionCardProps) {
    // Optimistic like state
    const [liked, setLiked] = useState(currentUserLiked)
    const [likeCount, setLikeCount] = useState(likesCount)
    const [likeLoading, setLikeLoading] = useState(false)

    // Report modal
    const [showReportModal, setShowReportModal] = useState(false)
    const [reportReason, setReportReason] = useState<ReportReason>('other')
    const [reportDetails, setReportDetails] = useState('')
    const [reportLoading, setReportLoading] = useState(false)
    const [reportDone, setReportDone] = useState(reportedByUser)
    const [reportError, setReportError] = useState('')

    // Delete
    const [deleted, setDeleted] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Like toggle
    async function handleLike() {
        if (likeLoading) return
        setLikeLoading(true)
        // Optimistic update
        setLiked(!liked)
        setLikeCount(prev => liked ? prev - 1 : prev + 1)

        const result = await toggleLike(id)
        if (!result.success) {
            // Revert
            setLiked(liked)
            setLikeCount(likesCount)
        } else {
            setLiked(result.liked)
            setLikeCount(result.newCount)
        }
        setLikeLoading(false)
    }

    // Report submit
    async function handleReport(e: React.FormEvent) {
        e.preventDefault()
        setReportLoading(true)
        setReportError('')

        const result = await reportConfession(id, reportReason, reportDetails)
        if (!result.success) {
            setReportError(result.error || 'Failed to report.')
        } else {
            setReportDone(true)
            setShowReportModal(false)
        }
        setReportLoading(false)
    }

    // Delete
    async function handleDelete() {
        if (!confirm('Delete this confession? This cannot be undone.')) return
        setDeleteLoading(true)
        const result = await deleteConfession(id)
        if (result.success) {
            setDeleted(true)
        } else {
            alert(result.error || 'Failed to delete confession')
        }
        setDeleteLoading(false)
    }

    if (deleted) return null

    return (
        <>
            <article className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">A</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">Anonymous</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {timeAgo(createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Delete button (owner/admin only) */}
                    {(isOwner || isAdmin) && (
                        <button
                            onClick={handleDelete}
                            disabled={deleteLoading}
                            aria-label="Delete confession"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <Link href={`/confession/${id}`} className="block">
                    <p className="text-sm md:text-base leading-relaxed text-card-foreground whitespace-pre-wrap line-clamp-5 hover:text-primary transition-colors">
                        {content}
                    </p>
                </Link>

                {/* Actions */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/40">
                    {/* Like */}
                    <button
                        onClick={handleLike}
                        disabled={likeLoading}
                        aria-label={liked ? 'Unlike' : 'Like'}
                        className={cn(
                            'flex items-center gap-1.5 text-sm font-medium transition-all duration-150 group/like',
                            liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        <Heart
                            className={cn(
                                'h-4 w-4 transition-transform group-hover/like:scale-110',
                                liked && 'fill-current'
                            )}
                        />
                        <span>{likeCount}</span>
                    </button>

                    {/* Comments */}
                    <Link
                        href={`/confession/${id}#comments`}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 group/comment hover:text-primary"
                        aria-label="Comments"
                    >
                        <MessageCircle className="h-4 w-4 transition-transform group-hover/comment:scale-110" />
                        <span>{commentsCount}</span>
                    </Link>

                    {/* Report */}
                    <button
                        onClick={() => !reportDone && setShowReportModal(true)}
                        aria-label="Report confession"
                        className={cn(
                            'flex items-center gap-1 text-xs transition-colors',
                            reportDone
                                ? 'text-muted-foreground/40 cursor-default'
                                : 'text-muted-foreground hover:text-destructive'
                        )}
                    >
                        <Flag className="h-3 w-3" />
                        <span className="hidden sm:inline">{reportDone ? 'Reported' : 'Report'}</span>
                    </button>
                </div>
            </article>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
                        <h3 className="font-semibold text-base">Report This Confession</h3>
                        <p className="text-sm text-muted-foreground">
                            Why are you reporting this?
                        </p>

                        {reportError && (
                            <p className="text-xs text-destructive">{reportError}</p>
                        )}

                        <form onSubmit={handleReport} className="space-y-3">
                            <div className="space-y-2">
                                {REPORT_REASONS.map(r => (
                                    <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="report-reason"
                                            value={r.value}
                                            checked={reportReason === r.value}
                                            onChange={() => setReportReason(r.value)}
                                            className="text-primary accent-primary"
                                        />
                                        <span className="text-sm group-hover:text-foreground transition-colors">{r.label}</span>
                                    </label>
                                ))}
                            </div>

                            <textarea
                                value={reportDetails}
                                onChange={e => setReportDetails(e.target.value)}
                                placeholder="Additional details (optional)"
                                rows={3}
                                maxLength={500}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 h-9 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reportLoading}
                                    className="flex-1 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                >
                                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

// Legacy support for old prop shape
export function ConfessionCardLegacy({ id, content, likes, commentsCount = 0, createdAt, isOwner, isAdmin }: {
    id: string; content: string; likes: number; commentsCount?: number; createdAt: string; isOwner?: boolean; isAdmin?: boolean
}) {
    return <ConfessionCard id={id} content={content} likesCount={likes} commentsCount={commentsCount} createdAt={createdAt} isOwner={isOwner} isAdmin={isAdmin} />
}
