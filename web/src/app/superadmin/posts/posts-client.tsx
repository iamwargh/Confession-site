'use client'

/**
 * SUPERADMIN POSTS CLIENT — Delete any confession, search, paginate.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Search, ShieldAlert, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { deleteConfession } from '@/lib/actions/confessions'

interface Post {
    id: string
    content: string
    likes_count: number
    created_at: string
    is_deleted: boolean
}

interface Props {
    posts: Post[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery: string
    adminId: string
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24) return `${hrs}h ago`
    return `${days}d ago`
}

export function SuperAdminPostsClient({ posts: initialPosts, totalCount, currentPage, pageSize, searchQuery, adminId }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [posts, setPosts] = useState<Post[]>(initialPosts)
    const [search, setSearch] = useState(searchQuery)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const totalPages = Math.ceil(totalCount / pageSize)

    function navigate(updates: Record<string, string>) {
        const params = new URLSearchParams({ q: searchQuery, page: String(currentPage), ...updates })
        if (!params.get('q')) params.delete('q')
        if (params.get('page') === '1') params.delete('page')
        startTransition(() => router.push(`/superadmin/posts?${params.toString()}`))
    }

    async function handleDelete(postId: string) {
        if (!confirm('Delete this confession permanently? This cannot be undone.')) return
        setDeletingId(postId)

        const result = await deleteConfession(postId)
        if (result.success) {
            setPosts(prev => prev.filter(p => p.id !== postId))
        } else {
            alert(result.error || 'Failed to delete confession')
        }
        setDeletingId(null)
    }

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Post Management</h1>
                        <p className="text-sm text-muted-foreground">{totalCount} confessions</p>
                    </div>
                    <Link href="/superadmin/dashboard" className="ml-auto text-sm text-primary hover:underline font-medium">
                        ← Dashboard
                    </Link>
                </div>

                {/* Search */}
                <form
                    onSubmit={e => { e.preventDefault(); navigate({ q: search, page: '1' }) }}
                    className="relative max-w-md"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search confession content..."
                        className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </form>

                {/* Posts Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {posts.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm">No confessions found.</div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {posts.map(post => (
                                <div key={post.id} className="p-4 flex gap-4 items-start group hover:bg-muted/20 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed line-clamp-3 text-foreground/80">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs text-muted-foreground">❤️ {post.likes_count}</span>
                                            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                                            <Link
                                                href={`/confession/${post.id}`}
                                                target="_blank"
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        disabled={deletingId === post.id}
                                        className="h-8 w-8 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
                                        title="Delete confession"
                                    >
                                        {deletingId === post.id
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4" />
                                        }
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate({ page: String(currentPage - 1) })}
                                disabled={currentPage <= 1 || isPending}
                                className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={() => navigate({ page: String(currentPage + 1) })}
                                disabled={currentPage >= totalPages || isPending}
                                className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
