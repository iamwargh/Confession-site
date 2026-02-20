'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * SUSPEND / BAN / DELETE ACCOUNT SYSTEM — AI-28 (Claude Opus 4.6)
 * 
 * Critical security logic for Super Admin account management.
 * 
 * Three tiers of action:
 * 1. SUSPEND — Temporary lockout (1 day / 1 week / 1 month / permanent)
 * 2. BAN — Permanent suspension (no expiry date)
 * 3. DELETE — Full data purge (irreversible)
 * 
 * All actions:
 * - Require superadmin role
 * - Are logged in admin_actions table
 * - Include safety checks (can't delete/ban self, can't ban superadmins)
 */

export type SuspendDuration = '1d' | '1w' | '1m' | 'permanent'

interface ActionResult {
    success: boolean
    error?: string
}

// ================================================================
// HELPERS
// ================================================================

function getDurationMs(duration: SuspendDuration): number | null {
    switch (duration) {
        case '1d': return 24 * 60 * 60 * 1000
        case '1w': return 7 * 24 * 60 * 60 * 1000
        case '1m': return 30 * 24 * 60 * 60 * 1000
        case 'permanent': return null
    }
}

function getDurationLabel(duration: SuspendDuration): string {
    switch (duration) {
        case '1d': return '1 day'
        case '1w': return '1 week'
        case '1m': return '1 month'
        case 'permanent': return 'permanently'
    }
}

async function verifySuperAdmin(): Promise<{ callerId: string | null; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { callerId: null, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') {
        return { callerId: null, error: 'Only Super Admins can perform this action' }
    }

    return { callerId: user.id }
}


// ================================================================
// 1. SUSPEND USER
// ================================================================

/**
 * Suspend a user account for a specified duration.
 * Only Super Admins can suspend users.
 * 
 * Duration options:
 * - 1d: Suspended for 1 day
 * - 1w: Suspended for 1 week  
 * - 1m: Suspended for 1 month
 * - permanent: Suspended indefinitely (no auto-expire)
 */
export async function suspendUser(
    targetUserId: string,
    duration: SuspendDuration,
    reason: string
): Promise<ActionResult> {
    const { callerId, error: authError } = await verifySuperAdmin()
    if (!callerId) return { success: false, error: authError }

    // Self-check
    if (targetUserId === callerId) {
        return { success: false, error: 'You cannot suspend yourself' }
    }

    const adminClient = createAdminClient()

    // Check target exists and isn't a superadmin
    const { data: target } = await adminClient
        .from('profiles')
        .select('role, username, is_suspended')
        .eq('id', targetUserId)
        .single()

    if (!target) {
        return { success: false, error: 'User not found' }
    }

    if (target.role === 'superadmin') {
        return { success: false, error: 'Cannot suspend another Super Admin' }
    }

    if (target.is_suspended) {
        return { success: false, error: 'User is already suspended' }
    }

    // Calculate suspension end date
    const durationMs = getDurationMs(duration)
    const suspendedUntil = durationMs ? new Date(Date.now() + durationMs).toISOString() : null

    // Suspend the user
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({
            is_suspended: true,
            suspended_until: suspendedUntil,
            suspension_reason: reason || `Suspended for ${getDurationLabel(duration)}`,
        })
        .eq('id', targetUserId)

    if (updateError) {
        console.error('Error suspending user:', updateError)
        return { success: false, error: 'Failed to suspend user' }
    }

    // Log action
    const supabase = await createClient()
    await supabase.from('admin_actions').insert({
        admin_id: callerId,
        action_type: 'suspend_user',
        target_user_id: targetUserId,
        notes: `Suspended user "${target.username}" for ${getDurationLabel(duration)}. Reason: ${reason}`,
        metadata: {
            duration,
            suspended_until: suspendedUntil,
            reason,
        },
    })

    return { success: true }
}


// ================================================================
// 2. UNSUSPEND USER
// ================================================================

/**
 * Remove suspension from a user account.
 */
export async function unsuspendUser(targetUserId: string): Promise<ActionResult> {
    const { callerId, error: authError } = await verifySuperAdmin()
    if (!callerId) return { success: false, error: authError }

    const adminClient = createAdminClient()

    const { data: target } = await adminClient
        .from('profiles')
        .select('username, is_suspended')
        .eq('id', targetUserId)
        .single()

    if (!target) {
        return { success: false, error: 'User not found' }
    }

    if (!target.is_suspended) {
        return { success: false, error: 'User is not suspended' }
    }

    const { error: updateError } = await adminClient
        .from('profiles')
        .update({
            is_suspended: false,
            suspended_until: null,
            suspension_reason: null,
        })
        .eq('id', targetUserId)

    if (updateError) {
        return { success: false, error: 'Failed to unsuspend user' }
    }

    const supabase = await createClient()
    await supabase.from('admin_actions').insert({
        admin_id: callerId,
        action_type: 'unsuspend_user',
        target_user_id: targetUserId,
        notes: `Unsuspended user "${target.username}"`,
    })

    return { success: true }
}


// ================================================================
// 3. BAN USER (Permanent Suspension)
// ================================================================

/**
 * Permanently ban a user. This is a permanent suspension with no expiry.
 */
export async function banUser(
    targetUserId: string,
    reason: string
): Promise<ActionResult> {
    const { callerId, error: authError } = await verifySuperAdmin()
    if (!callerId) return { success: false, error: authError }

    if (targetUserId === callerId) {
        return { success: false, error: 'You cannot ban yourself' }
    }

    const adminClient = createAdminClient()

    const { data: target } = await adminClient
        .from('profiles')
        .select('role, username')
        .eq('id', targetUserId)
        .single()

    if (!target) {
        return { success: false, error: 'User not found' }
    }

    if (target.role === 'superadmin') {
        return { success: false, error: 'Cannot ban a Super Admin' }
    }

    // Ban = permanent suspension (suspended_until = null, is_suspended = true)
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({
            is_suspended: true,
            suspended_until: null,
            suspension_reason: reason || 'Permanently banned',
            role: 'user', // Demote if they were admin
        })
        .eq('id', targetUserId)

    if (updateError) {
        return { success: false, error: 'Failed to ban user' }
    }

    const supabase = await createClient()
    await supabase.from('admin_actions').insert({
        admin_id: callerId,
        action_type: 'ban_user',
        target_user_id: targetUserId,
        notes: `Banned user "${target.username}" permanently. Reason: ${reason}`,
        metadata: { reason, previous_role: target.role },
    })

    return { success: true }
}


// ================================================================
// 4. DELETE ACCOUNT (Full Data Purge)
// ================================================================

/**
 * Permanently delete a user account and all their data.
 * THIS IS IRREVERSIBLE.
 * 
 * What gets deleted:
 * - User's profile
 * - All their confessions (cascade)
 * - All their likes (cascade)
 * - All their reports (cascade)
 * - Their Supabase auth account
 * 
 * Admin actions targeting this user are preserved (SET NULL).
 */
export async function deleteUserAccount(
    targetUserId: string,
    confirmationText: string
): Promise<ActionResult> {
    const { callerId, error: authError } = await verifySuperAdmin()
    if (!callerId) return { success: false, error: authError }

    // Safety: require explicit confirmation
    if (confirmationText !== 'DELETE') {
        return { success: false, error: 'Please type DELETE to confirm' }
    }

    if (targetUserId === callerId) {
        return { success: false, error: 'You cannot delete your own Super Admin account from here' }
    }

    const adminClient = createAdminClient()

    // Get target info before deletion (for logging)
    const { data: target } = await adminClient
        .from('profiles')
        .select('username, email, role')
        .eq('id', targetUserId)
        .single()

    if (!target) {
        return { success: false, error: 'User not found' }
    }

    if (target.role === 'superadmin') {
        return { success: false, error: 'Cannot delete a Super Admin account' }
    }

    // Log the action BEFORE deletion (since target_user_id will be SET NULL after cascade)
    const supabase = await createClient()
    await supabase.from('admin_actions').insert({
        admin_id: callerId,
        action_type: 'delete_account',
        target_user_id: targetUserId,
        notes: `Deleted account: "${target.username}" (${target.email}), role: ${target.role}`,
        metadata: {
            deleted_username: target.username,
            deleted_email: target.email,
            deleted_role: target.role,
        },
    })

    // Delete the profile (cascades to confessions, likes, reports)
    const { error: deleteProfileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', targetUserId)

    if (deleteProfileError) {
        console.error('Error deleting profile:', deleteProfileError)
        return { success: false, error: 'Failed to delete user profile' }
    }

    // Delete the auth user from Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId)

    if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError)
        // Profile is already deleted, but auth user remains — this is an inconsistent state
        // Log this as a critical error for manual cleanup
        return { success: false, error: 'Profile deleted but auth account removal failed. Manual cleanup needed in Supabase dashboard.' }
    }

    return { success: true }
}


// ================================================================
// 5. PROMOTE / DEMOTE ADMIN  (Supporting function for AI-27 / 28)
// ================================================================

/**
 * Change a user's role between 'user' and 'admin'.
 * Only Super Admins can do this.
 */
export async function changeUserRole(
    targetUserId: string,
    newRole: 'user' | 'admin'
): Promise<ActionResult> {
    const { callerId, error: authError } = await verifySuperAdmin()
    if (!callerId) return { success: false, error: authError }

    if (targetUserId === callerId) {
        return { success: false, error: 'You cannot change your own role' }
    }

    const adminClient = createAdminClient()

    const { data: target } = await adminClient
        .from('profiles')
        .select('role, username')
        .eq('id', targetUserId)
        .single()

    if (!target) {
        return { success: false, error: 'User not found' }
    }

    if (target.role === 'superadmin') {
        return { success: false, error: 'Cannot change a Super Admin\'s role' }
    }

    if (target.role === newRole) {
        return { success: false, error: `User is already a ${newRole}` }
    }

    const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

    if (updateError) {
        return { success: false, error: 'Failed to update user role' }
    }

    const actionType = newRole === 'admin' ? 'promote_to_admin' : 'demote_from_admin'

    const supabase = await createClient()
    await supabase.from('admin_actions').insert({
        admin_id: callerId,
        action_type: actionType,
        target_user_id: targetUserId,
        notes: `${newRole === 'admin' ? 'Promoted' : 'Demoted'} user "${target.username}" — role changed from ${target.role} to ${newRole}`,
        metadata: { previous_role: target.role, new_role: newRole },
    })

    return { success: true }
}
