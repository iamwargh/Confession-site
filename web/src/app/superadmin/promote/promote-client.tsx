'use client'

/**
 * PROMOTE/DEMOTE CLIENT — AI-27 (Claude Sonnet 4.6)
 * Promote users to admin, demote admins to user.
 */

import { useState } from 'react'
import { changeUserRole } from '@/lib/actions/superadmin-account'
import { Shield, ShieldOff, User, Search, Loader2, Crown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    created_at: string
}

interface Props {
    users: UserProfile[]
    currentUserId: string
}

export function PromoteDemoteClient({ users: initialUsers, currentUserId }: Props) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers)
    const [search, setSearch] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [errorMap, setErrorMap] = useState<Record<string, string>>({})
    const [successMap, setSuccessMap] = useState<Record<string, string>>({})
    const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all')

    const filtered = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || u.role === filter
        return matchesSearch && matchesFilter
    })

    async function handleRoleChange(userId: string, newRole: 'admin' | 'user') {
        setProcessingId(userId)
        setErrorMap(prev => ({ ...prev, [userId]: '' }))
        setSuccessMap(prev => ({ ...prev, [userId]: '' }))

        // changeUserRole expects 'admin' only (toggles between user/admin)
        const result = await changeUserRole(userId, newRole)

        if (!result.success) {
            setErrorMap(prev => ({ ...prev, [userId]: result.error || 'Failed to change role.' }))
        } else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
            setSuccessMap(prev => ({
                ...prev,
                [userId]: newRole === 'admin' ? 'Promoted to Admin ✓' : 'Demoted to User ✓'
            }))
            setTimeout(() => setSuccessMap(prev => ({ ...prev, [userId]: '' })), 3000)
        }

        setProcessingId(null)
    }

    const adminCount = users.filter(u => u.role === 'admin').length

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Promote / Demote</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage admin roles · {adminCount} admin{adminCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/superadmin/dashboard" className="ml-auto text-sm text-primary hover:underline font-medium">
                        ← Dashboard
                    </Link>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex gap-1 p-1 rounded-md border border-border bg-muted/30">
                        {(['all', 'admin', 'user'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'px-3 py-1 rounded text-xs font-medium capitalize transition-colors',
                                    filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User List */}
                {filtered.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                        No users match your search.
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card divide-y divide-border/40">
                        {filtered.map(u => (
                            <div key={u.id} className="p-4 flex items-center gap-4">
                                {/* Avatar */}
                                <div className={cn(
                                    'h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                                    u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                )}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">@{u.username}</span>
                                        <span className={cn(
                                            'text-xs px-2 py-0.5 rounded-full font-medium',
                                            u.role === 'admin'
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        )}>
                                            {u.role === 'admin' ? 'Admin' : 'User'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                    {successMap[u.id] && (
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                                            {successMap[u.id]}
                                        </p>
                                    )}
                                    {errorMap[u.id] && (
                                        <p className="text-xs text-destructive mt-0.5">{errorMap[u.id]}</p>
                                    )}
                                </div>

                                {/* Action */}
                                <div className="flex items-center shrink-0">
                                    {u.id === currentUserId ? (
                                        <span className="text-xs text-muted-foreground/50">You</span>
                                    ) : u.role === 'admin' ? (
                                        <button
                                            onClick={() => handleRoleChange(u.id, 'user')}
                                            disabled={processingId === u.id}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                        >
                                            {processingId === u.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <ShieldOff className="h-3 w-3" />
                                            )}
                                            Demote
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRoleChange(u.id, 'admin')}
                                            disabled={processingId === u.id}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary/30 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                                        >
                                            {processingId === u.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Shield className="h-3 w-3" />
                                            )}
                                            Promote
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
