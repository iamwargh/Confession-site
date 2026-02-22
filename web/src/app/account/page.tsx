/**
 * ACCOUNT PAGE — Profile overview + links to settings, delete account.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Shield, Trash2, Heart, Lock } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
    title: 'My Account — OffChest',
}

export default async function AccountPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?redirect=/account')

    const { data: profile } = await supabase
        .from('profiles')
        .select('username, role, created_at')
        .eq('id', user.id)
        .single()

    const { count: confessionCount } = await supabase
        .from('confessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false)

    const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Unknown'

    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    My Account
                </h1>

                {/* Profile Card */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                            {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">@{profile?.username ?? 'unknown'}</h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {profile?.role && profile.role !== 'user' && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                                    <Shield className="h-3 w-3" />
                                    {profile.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Confessions</p>
                            <p className="text-2xl font-bold">{confessionCount ?? 0}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Member since</p>
                            <p className="text-sm font-medium">{memberSince}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                    <Link href="/my-confessions">
                        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all group">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Heart className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">My Confessions</p>
                                <p className="text-xs text-muted-foreground">View and delete your posts</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/forgot-password">
                        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all group">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">Change Password</p>
                                <p className="text-xs text-muted-foreground">Reset via email link</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/account/delete">
                        <div className="rounded-xl border border-destructive/20 bg-card p-4 flex items-center gap-3 hover:border-destructive/40 hover:bg-destructive/5 transition-all group">
                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-destructive">Delete Account</p>
                                <p className="text-xs text-muted-foreground">Permanently remove your account</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
