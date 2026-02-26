'use client'

import { useState, useEffect } from 'react'
import { Heart, Flag, Loader2 } from 'lucide-react'
import {
    getComments,
    addComment,
    toggleCommentLike,
    reportComment,
    type CommentData,
    type CommentReportReason
} from '@/lib/actions/comments'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
    confessionId: string
    isLoggedIn: boolean
}

const REPORT_REASONS: { value: CommentReportReason; label: string }[] = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'self_harm', label: 'Self-harm' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'other', label: 'Other/Rule Violation' },
]

export function CommentSection({ confessionId, isLoggedIn }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentData[]>([])
    const [loading, setLoading] = useState(true)

    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadComments() {
            setLoading(true)
            const result = await getComments(confessionId)
            if (result.success && result.comments) {
                // Ensure proper typing when setting state
                const fetchedComments = result.comments as any;
                setComments(fetchedComments)
            }
            setLoading(false)
        }
        loadComments()
    }, [confessionId])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!isLoggedIn) {
            setError('You must be logged in to comment.')
            return
        }

        if (!newComment.trim()) {
            setError('Comment cannot be empty.')
            return
        }

        setSubmitting(true)
        const result = await addComment(confessionId, newComment)

        if (!result.success) {
            setError(result.error || 'Failed to post comment')
            setSubmitting(false)
            return
        }

        // Add optimistic to top
        if (result.comment) {
            setComments([{
                id: result.comment.id,
                confession_id: confessionId,
                content: result.comment.content,
                username: result.comment.username,
                likes_count: 0,
                created_at: new Date().toISOString(),
                user_id: result.comment.user_id, // we don't have strictly typed returned id but it works optimistically
                currentUserLiked: false,
                reportedByUser: false
            }, ...comments])

            setNewComment('')
        }
        setSubmitting(false)
    }

    return (
        <div id="comments" className="rounded-xl border border-border/40 bg-card/50 p-4 sm:p-6 space-y-6">
            <h3 className="text-base font-semibold">Comments ({comments.length})</h3>

            {/* Comment Form */}
            {isLoggedIn ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {error && <p className="text-xs text-destructive">{error}</p>}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Add your anonymous thought..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            maxLength={500}
                            disabled={submitting}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Post Comment
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-4 rounded-md bg-accent/50 text-center text-sm text-muted-foreground border border-border/40">
                    Log in to add a comment
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                ) : (
                    <div className="divide-y divide-border/40">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                isLoggedIn={isLoggedIn}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function CommentItem({ comment, isLoggedIn }: { comment: CommentData, isLoggedIn: boolean }) {
    const [liked, setLiked] = useState(comment.currentUserLiked || false)
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0)
    const [likeLoading, setLikeLoading] = useState(false)

    const [reported, setReported] = useState(comment.reportedByUser || false)
    const [showReport, setShowReport] = useState(false)
    const [reportLoading, setReportLoading] = useState(false)
    const [reportReason, setReportReason] = useState<CommentReportReason>('other')

    // Time ago
    const diff = Date.now() - new Date(comment.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const timeStr = mins < 1 ? 'just now' : mins < 60 ? `${mins}m` : hours < 24 ? `${hours}h` : `${days}d`

    async function handleLike() {
        if (!isLoggedIn) return alert("Log in to like comments.")
        if (likeLoading) return

        setLikeLoading(true)
        setLiked(!liked)
        setLikesCount(prev => liked ? prev - 1 : prev + 1)

        const result = await toggleCommentLike(comment.id)
        if (!result.success) {
            // Revert on error
            setLiked(liked)
            setLikesCount(likesCount)
            alert(result.error)
        }
        setLikeLoading(false)
    }

    async function handleReport(e: React.FormEvent) {
        e.preventDefault()
        if (!isLoggedIn) return alert("Log in to report comments.")

        setReportLoading(true)
        const result = await reportComment(comment.id, reportReason)

        if (result.success) {
            setReported(true)
            setShowReport(false)
        } else {
            alert(result.error)
        }
        setReportLoading(false)
    }

    return (
        <div className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">• {timeStr}</span>
                </div>
            </div>

            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>

            <div className="flex items-center gap-4 mt-3">
                <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary",
                        liked ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
                    <span>{likesCount > 0 ? likesCount : 'Like'}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => !reported && setShowReport(!showReport)}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-destructive",
                            reported ? "text-muted-foreground/40 cursor-default" : "text-muted-foreground"
                        )}
                    >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{reported ? 'Reported' : 'Report'}</span>
                    </button>

                    {showReport && (
                        <div className="absolute top-full mt-2 left-0 z-10 w-48 bg-card border border-border shadow-md rounded-md p-3">
                            <form onSubmit={handleReport} className="space-y-2">
                                <p className="text-xs font-semibold mb-2">Report Comment</p>
                                {REPORT_REASONS.map((r) => (
                                    <label key={r.value} className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`report-${comment.id}`}
                                            value={r.value}
                                            checked={reportReason === r.value}
                                            onChange={() => setReportReason(r.value)}
                                            className="text-primary"
                                        />
                                        {r.label}
                                    </label>
                                ))}
                                <div className="flex justify-end pt-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowReport(false)}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={reportLoading}
                                        className="text-xs font-medium text-destructive disabled:opacity-50"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
