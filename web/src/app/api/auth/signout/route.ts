import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/signout
 *
 * Server-side sign out.
 * Clears session cookies and redirects to /login.
 */
export async function POST(request: NextRequest) {
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

    await supabase.auth.signOut()

    const { origin } = new URL(request.url)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
    const response = NextResponse.redirect(`${siteUrl}/login`, { status: 302 })

    // Propagate Supabase cookie-clearing cookies
    cookiesToReturn.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
    })

    return response
}
