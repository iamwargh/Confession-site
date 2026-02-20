'use client'

/**
 * ADMIN USERS CLIENT — lock/unlock users, search, filter.
 */

import { useState } from 'react'
import { lockUser, unlockUser, type LockDuration } from '@/lib/actions/admin-lock'
import { Lock, Unlock, Search, Loader2, Shield, ShieldAlert, Eye } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    is_suspended: boolean
    suspended_until: string | null
    suspension_reason: string | null
    created_at: string
}

interface Props {
    users: UserProfile[]
    adminId: string
    adminRole: string
}

export function AdminUsersClient({ users: initialUsers, adminId, adminRole }: Props) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'suspended' | 'active'>('all')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [lockModal, setLockModal] = useState<UserProfile | null>(null)
    const [lockDuration, setLockDuration] = useState<LockDuration>('1d')
    const [lockReason, setLockReason] = useState('')
    const [lockLoading, setLockLoading] = useState(false)
    const [errorMap, setErrorMap] = useState<Record<string, string>>({})

    const filtered = users.filter(u => {
        const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchFilter =
            filter === 'all' ||
            (filter === 'suspended' && u.is_suspended) ||
            (filter === 'active' && !u.is_suspended)
        return matchSearch && matchFilter
    })

    async function handleUnlock(u: UserProfile) {
        setProcessingId(u.id)
        const result = await unlockUser(u.id)
        if (!result.success) {
            setErrorMap(prev => ({ ...prev, [u.id]: result.error || 'Failed to unlock.' }))
        } else {
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_suspended: false, suspended_until: null, suspension_reason: null } : x))
        }
        setProcessingId(null)
    }

    async function handleLock() {
        if (!lockModal) return
        setLockLoading(true)
        const result = await lockUser(lockModal.id, lockDuration, lockReason || 'Admin lock')
        if (!result.success) {
            setErrorMap(prev => ({ ...prev, [lockModal.id]: result.error || 'Failed to lock.' }))
        } else {
            const until = new Date(Date.now() + getLockMs(lockDuration)).toISOString()
            setUsers(prev => prev.map(x => x.id === lockModal.id
                ? { ...x, is_suspended: true, suspended_until: until, suspension_reason: lockReason }
                : x
            ))
            setLockModal(null)
        }
        setLockLoading(false)
    }

    function getLockMs(d: LockDuration) {
        return d === '1d' ? 86400000 : d === '3d' ? 259200000 : 604800000
    }

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Manage Users</h1>
                        <p className="text-sm text-muted-foreground">{users.length} total users</p>
                    </div>
                    <Link href="/admin/dashboard" className="ml-auto text-sm text-primary hover:underline font-medium">
                        ← Dashboard
                    </Link>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search username or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex gap-1 p-1 rounded-md border border-border bg-muted/30">
                        {(['all', 'active', 'suspended'] as const).map(f => (
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

                {/* User Table */}
                <div className="rounded-xl border border-border bg-card divide-y divide-border/40">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>
                    ) : filtered.map(u => (
                        <div key={u.id} className="p-4 flex flex-wrap items-center gap-3">
                            <div className={cn(
                                'h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                                u.is_suspended ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'
                            )}>
                                {u.username.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">@{u.username}</span>
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full',
                                        u.role === 'admin' ? 'bg-primary/10 text-primary' :
                                            u.is_suspended ? 'bg-red-500/10 text-red-400' :
                                                'bg-muted text-muted-foreground'
                                    )}>
                                        {u.is_suspended ? 'Suspended' : u.role}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                {u.is_suspended && u.suspension_reason && (
                                    <p className="text-xs text-red-400 mt-0.5">Reason: {u.suspension_reason}</p>
                                )}
                                {errorMap[u.id] && (
                                    <p className="text-xs text-destructive mt-0.5">{errorMap[u.id]}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {u.is_suspended ? (
                                    <button
                                        onClick={() => handleUnlock(u)}
                                        disabled={processingId === u.id}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                    >
                                        {processingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                                        Unlock
                                    </button>
                                ) : (
                                    u.role !== 'admin' && u.role !== 'superadmin' && (
                                        <button
                                            onClick={() => setLockModal(u)}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition-colors"
                                        >
                                            <Lock className="h-3 w-3" />
                                            Lock
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lock Modal */}
            {lockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-500" />
                            Lock @{lockModal.username}
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Duration</label>
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
                                <label className="text-sm font-medium">Reason</label>
                                <input
                                    type="text"
                                    value={lockReason}
                                    onChange={e => setLockReason(e.target.value)}
                                    placeholder="Reason..."
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setLockModal(null)} className="flex-1 h-9 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleLock}
                                disabled={lockLoading}
                                className="flex-1 h-9 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                {lockLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                                Confirm Lock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
