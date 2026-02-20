/**
 * ACCOUNT DELETE API ROUTE — AI-10 (Claude Sonnet 4.6)
 * Called by the client-side delete page. Runs server-side with admin privileges.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 })
    }

    // Prevent deleting admins/superadmins via this endpoint
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
        return NextResponse.json({
            success: false,
            error: 'Admin accounts cannot self-delete. Contact a Super Admin.',
        }, { status: 403 })
    }

    try {
        // Soft delete: mark confessions as deleted (keep for moderation logs)
        await supabase
            .from('confessions')
            .update({ is_deleted: true })
            .eq('user_id', user.id)

        // Delete likes and reports
        await supabase.from('likes').delete().eq('user_id', user.id)

        // Delete the profile (cascades to other FK-linked data)
        await adminClient.from('profiles').delete().eq('id', user.id)

        // Delete the auth user (must be done last)
        await adminClient.auth.admin.deleteUser(user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Account delete error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete account.' }, { status: 500 })
    }
}
