import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Ban, Clock } from 'lucide-react'
import { SignOutButton } from './signout-button'

/**
 * SUSPENDED PAGE — AI-24 (Claude Opus 4.6)
 *
 * Shown when a suspended user tries to access protected routes.
 * Displays the suspension reason and duration.
 */

export const dynamic = 'force-dynamic'

export default async function SuspendedPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_suspended, suspended_until, suspension_reason')
        .eq('id', user!.id)
        .single()

    // If not actually suspended, redirect home
    if (!profile || !profile.is_suspended) {
        redirect('/')
    }

    const isPermanent = profile.suspended_until === null
    const suspendedUntil = profile.suspended_until
        ? new Date(profile.suspended_until).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : null

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 text-center container mx-auto px-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 mb-8">
                {isPermanent ? (
                    <Ban className="h-12 w-12 text-red-400" />
                ) : (
                    <Clock className="h-12 w-12 text-amber-400" />
                )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-3">
                {isPermanent ? 'Account Banned' : 'Account Suspended'}
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-6">
                {isPermanent
                    ? 'Your account has been permanently banned from OffChest.'
                    : 'Your account has been temporarily suspended.'
                }
            </p>

            {profile.suspension_reason && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 max-w-md mb-6">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">Reason:</p>
                    <p className="text-sm">{profile.suspension_reason}</p>
                </div>
            )}

            {!isPermanent && suspendedUntil && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 max-w-md mb-6">
                    <p className="text-sm text-amber-200">
                        Your suspension expires on <strong>{suspendedUntil}</strong>.
                        You can try logging in again after that time.
                    </p>
                </div>
            )}

            {/* Client-side sign-out so Navbar immediately reflects logout */}
            <SignOutButton />
        </div>
    )
}
