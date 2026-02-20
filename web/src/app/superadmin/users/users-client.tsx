'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Search, Filter, Users, Shield, ShieldAlert, UserX, Ban,
    Lock, Unlock, Trash2, ArrowUpDown, ChevronLeft, ChevronRight,
    Eye, MoreHorizontal, X, Check, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lockUser, unlockUser } from '@/lib/actions/admin-lock'
import { suspendUser, unsuspendUser, banUser, deleteUserAccount, changeUserRole } from '@/lib/actions/superadmin-account'
import type { LockDuration } from '@/lib/actions/admin-lock'
import type { SuspendDuration } from '@/lib/actions/superadmin-account'

/**
 * SUPER ADMIN USERS TABLE CLIENT — AI-26 (Claude Opus 4.6)
 * 
 * Interactive user management table with:
 * - Search by email/username
 * - Filter by role and status
 * - Action buttons (lock, suspend, ban, delete, promote/demote)
 * - User detail view modal
 * - Pagination
 */

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    is_verified: boolean
    is_suspended: boolean
    suspended_until: string | null
    suspension_reason: string | null
    created_at: string
}

interface Props {
    users: UserProfile[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery: string
    roleFilter: string
    statusFilter: string
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

function getStatusBadge(user: UserProfile) {
    if (user.is_suspended) {
        if (user.suspended_until === null) {
            return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><Ban className="h-3 w-3" /> Banned</span>
        }
        return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="h-3 w-3" /> Suspended</span>
    }
    return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20"><Check className="h-3 w-3" /> Active</span>
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function UsersTableClient({ users, totalCount, currentPage, pageSize, searchQuery, roleFilter, statusFilter }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState(searchQuery)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [actionModal, setActionModal] = useState<{ type: string; user: UserProfile } | null>(null)
    const [actionReason, setActionReason] = useState('')
    const [actionDuration, setActionDuration] = useState<string>('1d')
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const totalPages = Math.ceil(totalCount / pageSize)

    function updateSearchParams(updates: Record<string, string>) {
        const params = new URLSearchParams()
        const current: Record<string, string> = { q: searchQuery, role: roleFilter, status: statusFilter, page: String(currentPage) }
        Object.assign(current, updates)

        for (const [key, value] of Object.entries(current)) {
            if (value && value !== 'all' && value !== '1' && value !== '') {
                params.set(key, value)
            }
        }

        startTransition(() => {
            router.push(`/superadmin/users?${params.toString()}`)
        })
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        updateSearchParams({ q: search, page: '1' })
    }

    async function handleAction() {
        if (!actionModal) return
        setActionLoading(true)
        setActionMessage(null)

        try {
            let result

            switch (actionModal.type) {
                case 'lock':
                    result = await lockUser(actionModal.user.id, actionDuration as LockDuration, actionReason)
                    break
                case 'unlock':
                    result = await unlockUser(actionModal.user.id)
                    break
                case 'suspend':
                    result = await suspendUser(actionModal.user.id, actionDuration as SuspendDuration, actionReason)
                    break
                case 'unsuspend':
                    result = await unsuspendUser(actionModal.user.id)
                    break
                case 'ban':
                    result = await banUser(actionModal.user.id, actionReason)
                    break
                case 'delete':
                    result = await deleteUserAccount(actionModal.user.id, deleteConfirm)
                    break
                case 'promote':
                    result = await changeUserRole(actionModal.user.id, 'admin')
                    break
                case 'demote':
                    result = await changeUserRole(actionModal.user.id, 'user')
                    break
                default:
                    result = { success: false, error: 'Unknown action' }
            }

            if (result.success) {
                setActionMessage({ type: 'success', text: 'Action completed successfully!' })
                setTimeout(() => {
                    setActionModal(null)
                    setActionMessage(null)
                    setActionReason('')
                    setDeleteConfirm('')
                    router.refresh()
                }, 1500)
            } else {
                setActionMessage({ type: 'error', text: result.error || 'Action failed' })
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-400" />
                    User Management
                </h1>
                <p className="text-muted-foreground mt-1">
                    {totalCount} total user{totalCount !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by username or email..."
                        className="w-full bg-background pl-10 h-10 rounded-md border border-input text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-4"
                    />
                </form>
                <div className="flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => updateSearchParams({ role: e.target.value, page: '1' })}
                        className="bg-background h-10 rounded-md border border-input text-sm px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                        <option value="superadmin">Super Admins</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => updateSearchParams({ status: e.target.value, page: '1' })}
                        className="bg-background h-10 rounded-md border border-input text-sm px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended/Banned</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="h-11 px-4 text-left font-medium text-muted-foreground">User</th>
                                <th className="h-11 px-4 text-left font-medium text-muted-foreground">Email</th>
                                <th className="h-11 px-4 text-left font-medium text-muted-foreground">Role</th>
                                <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                                <th className="h-11 px-4 text-left font-medium text-muted-foreground">Joined</th>
                                <th className="h-11 px-4 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-primary">{user.username[0]?.toUpperCase()}</span>
                                                </div>
                                                <span className="font-medium">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.email}</td>
                                        <td className="p-4">{getRoleBadge(user.role)}</td>
                                        <td className="p-4">{getStatusBadge(user)}</td>
                                        <td className="p-4 text-muted-foreground">{formatDate(user.created_at)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)} title="View details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {user.role !== 'superadmin' && (
                                                    <>
                                                        {!user.is_suspended ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => { setActionModal({ type: 'suspend', user }); setActionReason(''); setActionDuration('1d') }}
                                                                    title="Suspend"
                                                                >
                                                                    <Lock className="h-4 w-4 text-amber-400" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => { setActionModal({ type: 'ban', user }); setActionReason('') }}
                                                                    title="Ban permanently"
                                                                >
                                                                    <Ban className="h-4 w-4 text-red-400" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setActionModal({ type: 'unsuspend', user })}
                                                                title="Unsuspend"
                                                            >
                                                                <Unlock className="h-4 w-4 text-green-400" />
                                                            </Button>
                                                        )}

                                                        {user.role === 'user' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setActionModal({ type: 'promote', user })}
                                                                title="Promote to Admin"
                                                            >
                                                                <Shield className="h-4 w-4 text-blue-400" />
                                                            </Button>
                                                        ) : user.role === 'admin' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setActionModal({ type: 'demote', user })}
                                                                title="Demote to User"
                                                            >
                                                                <UserX className="h-4 w-4 text-zinc-400" />
                                                            </Button>
                                                        ) : null}

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setActionModal({ type: 'delete', user }); setDeleteConfirm('') }}
                                                            title="Delete account"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-400" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages} ({totalCount} users)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => updateSearchParams({ page: String(currentPage - 1) })}
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => updateSearchParams({ page: String(currentPage + 1) })}
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ────────────────────────────────────── */}
            {/* USER DETAIL MODAL */}
            {/* ────────────────────────────────────── */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold">User Details</h2>
                            <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{selectedUser.username[0]?.toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">{selectedUser.username}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                                    <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                                    <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified</p>
                                    <p className="mt-1 text-sm">{selectedUser.is_verified ? '✅ Yes' : '❌ No'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Joined</p>
                                    <p className="mt-1 text-sm">{formatDate(selectedUser.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">User ID</p>
                                    <p className="mt-1 text-xs font-mono text-muted-foreground truncate" title={selectedUser.id}>{selectedUser.id}</p>
                                </div>
                                {selectedUser.is_suspended && (
                                    <>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Suspended Until</p>
                                            <p className="mt-1 text-sm">{selectedUser.suspended_until ? formatDate(selectedUser.suspended_until) : 'Permanent'}</p>
                                        </div>
                                        {selectedUser.suspension_reason && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Suspension Reason</p>
                                                <p className="mt-1 text-sm">{selectedUser.suspension_reason}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────────────────────────── */}
            {/* ACTION MODAL */}
            {/* ────────────────────────────────────── */}
            {actionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setActionModal(null); setActionMessage(null) }}>
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold capitalize">
                                {actionModal.type === 'promote' ? 'Promote to Admin' :
                                    actionModal.type === 'demote' ? 'Demote to User' :
                                        `${actionModal.type} User`}
                            </h2>
                            <button onClick={() => { setActionModal(null); setActionMessage(null) }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Target: <strong className="text-foreground">{actionModal.user.username}</strong> ({actionModal.user.email})
                        </p>

                        {/* Duration selector for suspend/lock */}
                        {(actionModal.type === 'suspend' || actionModal.type === 'lock') && (
                            <div>
                                <label className="text-sm font-medium">Duration</label>
                                <select
                                    value={actionDuration}
                                    onChange={(e) => setActionDuration(e.target.value)}
                                    className="w-full mt-1 bg-background h-10 rounded-md border border-input text-sm px-3"
                                >
                                    <option value="1d">1 Day</option>
                                    {actionModal.type === 'lock' && <option value="3d">3 Days</option>}
                                    <option value="1w">1 Week</option>
                                    <option value="1m">1 Month</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>
                        )}

                        {/* Reason input for suspend/ban/lock */}
                        {(actionModal.type === 'suspend' || actionModal.type === 'ban' || actionModal.type === 'lock') && (
                            <div>
                                <label className="text-sm font-medium">Reason</label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Enter reason..."
                                    rows={3}
                                    className="w-full mt-1 bg-background rounded-md border border-input text-sm p-3 resize-none"
                                />
                            </div>
                        )}

                        {/* Delete confirmation */}
                        {actionModal.type === 'delete' && (
                            <div>
                                <p className="text-sm text-destructive font-medium mb-2">
                                    ⚠️ This action is IRREVERSIBLE. All user data will be permanently deleted.
                                </p>
                                <label className="text-sm font-medium">Type DELETE to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full mt-1 bg-background h-10 rounded-md border border-input text-sm px-3 font-mono"
                                />
                            </div>
                        )}

                        {/* Confirmation for promote/demote */}
                        {(actionModal.type === 'promote' || actionModal.type === 'demote') && (
                            <p className="text-sm">
                                {actionModal.type === 'promote'
                                    ? `Are you sure you want to promote "${actionModal.user.username}" to Admin? They will be able to view reports, delete posts, and lock users.`
                                    : `Are you sure you want to demote "${actionModal.user.username}" from Admin to regular User?`
                                }
                            </p>
                        )}

                        {/* Unlock/unsuspend confirmation */}
                        {(actionModal.type === 'unlock' || actionModal.type === 'unsuspend') && (
                            <p className="text-sm">
                                Are you sure you want to {actionModal.type} &ldquo;{actionModal.user.username}&rdquo;?
                            </p>
                        )}

                        {/* Status message */}
                        {actionMessage && (
                            <div className={`p-3 rounded-md text-sm ${actionMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {actionMessage.text}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setActionModal(null); setActionMessage(null) }}>
                                Cancel
                            </Button>
                            <Button
                                variant={actionModal.type === 'delete' || actionModal.type === 'ban' ? 'destructive' : 'default'}
                                onClick={handleAction}
                                disabled={actionLoading || (actionModal.type === 'delete' && deleteConfirm !== 'DELETE')}
                            >
                                {actionLoading ? 'Processing...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
