import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DEBUG ENDPOINT — /api/debug/supabase
 *
 * Checks:
 * 1. Are the Supabase env vars present?
 * 2. Can we connect to Supabase?
 * 3. Is the user authenticated?
 * 4. Does the confessions table exist?
 * 5. Can we SELECT from confessions?
 * 6. Does the user have a profile row?
 *
 * Visit: https://offchest.vercel.app/api/debug/supabase
 * (while logged in to get full auth diagnosis)
 *
 * REMOVE THIS ROUTE before going to final production!
 */
export async function GET() {
    const result: Record<string, unknown> = {}

    // 1. Check env vars
    result.env = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `✅ SET (${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 40)}...)`
            : '❌ MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? `✅ SET (length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length})`
            : '❌ MISSING',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? `✅ SET (length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})`
            : '❌ MISSING',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '⚠️ Not set (using origin fallback)',
        NODE_ENV: process.env.NODE_ENV,
    }

    try {
        const supabase = await createClient()

        // 2. Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        result.auth = {
            isLoggedIn: !!user,
            userId: user?.id ?? null,
            email: user?.email ?? null,
            error: authError?.message ?? null,
        }

        // 3. Try SELECT from confessions (basic connectivity test)
        const { data: confessions, error: selectError, count } = await supabase
            .from('confessions')
            .select('id', { count: 'exact', head: true })

        result.confessions_table = {
            canSelect: !selectError,
            rowCount: count,
            error: selectError
                ? { code: selectError.code, message: selectError.message, hint: selectError.hint }
                : null,
        }

        // 4. If logged in, check profile row exists
        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, role, is_suspended, username')
                .eq('id', user.id)
                .single()

            result.user_profile = {
                exists: !!profile,
                profile: profile ?? null,
                error: profileError
                    ? { code: profileError.code, message: profileError.message }
                    : null,
            }

            // 5. Dry-run: check if insert would be blocked by RLS
            // We test by trying to count confessions for this user
            const { count: userCount, error: userCountError } = await supabase
                .from('confessions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            result.user_confessions = {
                count: userCount,
                error: userCountError
                    ? { code: userCountError.code, message: userCountError.message }
                    : null,
            }
        }

    } catch (err) {
        result.critical_error = String(err)
    }

    return NextResponse.json(result, { status: 200 })
}
