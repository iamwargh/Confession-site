'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ADMIN USER LOCK SYSTEM — AI-24 (Claude Opus 4.6)
 * 
 * Server actions for locking/unlocking user accounts.
 * 
 * Lock durations:
 * - 1 day
 * - 3 days  
 * - 7 days
 * 
 * Locking a user:
 * - Sets is_suspended = true
 * - Sets suspended_until = NOW() + duration
 * - Sets suspension_reason
 * - Logs the action in admin_actions
 * - Locked user will see a message on login attempt (middleware handles redirect)
 * 
 * Auto-expiry:
 * - Middleware calls check_suspension_expired() on each request
 * - If suspended_until has passed, auto-unsuspends the user
 */

export type LockDuration = '1d' | '3d' | '7d'

interface ActionResult {
    success: boolean
    error?: string
}

function getDurationMs(duration: LockDuration): number {
    switch (duration) {
        case '1d': return 24 * 60 * 60 * 1000
        case '3d': return 3 * 24 * 60 * 60 * 1000
        case '7d': return 7 * 24 * 60 * 60 * 1000
    }
}

function getDurationLabel(duration: LockDuration): string {
    switch (duration) {
        case '1d': return '1 day'
        case '3d': return '3 days'
        case '7d': return '7 days'
    }
}

/**
 * Lock a user's account for a specified duration.
 * Can only be called by admins or superadmins.
 */
export async function lockUser(
    targetUserId: string,
    duration: LockDuration,
    reason: string
): Promise<ActionResult> {
    const supabase = await createClient()

    // Verify the caller is an admin
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
        return { success: false, error: 'Not authenticated' }
    }

    // Get caller's profile to check role
    const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single()

    if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'superadmin')) {
        return { success: false, error: 'Insufficient permissions' }
    }

    // Get target user's profile to validate
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role, is_suspended, username')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) {
        return { success: false, error: 'User not found' }
    }

    // Admins cannot lock other admins or superadmins
    if (callerProfile.role === 'admin' && (targetProfile.role === 'admin' || targetProfile.role === 'superadmin')) {
        return { success: false, error: 'Admins cannot lock other admins or superadmins' }
    }

    // Superadmins cannot lock other superadmins (only themselves, but why would they?)
    if (callerProfile.role === 'superadmin' && targetProfile.role === 'superadmin' && targetUserId !== caller.id) {
        return { success: false, error: 'Cannot lock another superadmin' }
    }

    if (targetProfile.is_suspended) {
        return { success: false, error: 'User is already suspended' }
    }

    // Calculate suspension end date
    const suspendedUntil = new Date(Date.now() + getDurationMs(duration))

    // Use admin client to bypass RLS for the update
    const adminClient = createAdminClient()

    // Update the user's profile
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({
            is_suspended: true,
            suspended_until: suspendedUntil.toISOString(),
            suspension_reason: reason || `Account locked for ${getDurationLabel(duration)}`,
        })
        .eq('id', targetUserId)

    if (updateError) {
        console.error('Error locking user:', updateError)
        return { success: false, error: 'Failed to lock user. Please try again.' }
    }

    // Log the admin action
    const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
            admin_id: caller.id,
            action_type: 'lock_user',
            target_user_id: targetUserId,
            notes: `Locked user "${targetProfile.username}" for ${getDurationLabel(duration)}. Reason: ${reason}`,
            metadata: {
                duration,
                suspended_until: suspendedUntil.toISOString(),
                reason,
            },
        })

    if (logError) {
        console.error('Error logging admin action:', logError)
        // Don't fail the whole action just because logging failed
    }

    return { success: true }
}


/**
 * Unlock a user's account (remove suspension).
 * Can only be called by admins or superadmins.
 */
export async function unlockUser(targetUserId: string): Promise<ActionResult> {
    const supabase = await createClient()

    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
        return { success: false, error: 'Not authenticated' }
    }

    const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single()

    if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'superadmin')) {
        return { success: false, error: 'Insufficient permissions' }
    }

    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('username, is_suspended')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) {
        return { success: false, error: 'User not found' }
    }

    if (!targetProfile.is_suspended) {
        return { success: false, error: 'User is not suspended' }
    }

    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient
        .from('profiles')
        .update({
            is_suspended: false,
            suspended_until: null,
            suspension_reason: null,
        })
        .eq('id', targetUserId)

    if (updateError) {
        console.error('Error unlocking user:', updateError)
        return { success: false, error: 'Failed to unlock user. Please try again.' }
    }

    // Log the action
    await supabase
        .from('admin_actions')
        .insert({
            admin_id: caller.id,
            action_type: 'unlock_user',
            target_user_id: targetUserId,
            notes: `Unlocked user "${targetProfile.username}"`,
        })

    return { success: true }
}
