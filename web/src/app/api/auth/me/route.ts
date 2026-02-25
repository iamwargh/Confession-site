import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user + profile data.
 * Runs entirely on the server — bypasses ISP-level blocking of *.supabase.co.
 *
 * Used by client components (Navbar, etc.) instead of direct browser Supabase calls.
 *
 * Returns:
 *   { user: { id, email, ... }, profile: { username, role } }   when logged in
 *   { user: null, profile: null }                                when not logged in
 */
export async function GET(request: NextRequest) {
    try {
        const cookiesToReturn: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach((cookie) => {
                            cookiesToReturn.push(cookie)
                        })
                    },
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            }
        )

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            const response = NextResponse.json({ user: null, profile: null })
            // Still propagate any cookies (e.g. cleared/refreshed tokens)
            cookiesToReturn.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
            })
            return response
        }

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, role, is_suspended')
            .eq('id', user.id)
            .single()

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
            },
            profile: profile || null,
        })

        // Propagate any refreshed cookies
        cookiesToReturn.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (err) {
        console.error('[/api/auth/me] Error:', err)
        return NextResponse.json({ user: null, profile: null })
    }
}
