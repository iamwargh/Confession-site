import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Provider } from '@supabase/supabase-js'

/**
 * GET /api/auth/oauth?provider=[google|twitter]
 *
 * Server-side OAuth initiation.
 * Runs signInWithOAuth() on the server to generate the OAuth redirect URL
 * without the browser needing direct access to *.supabase.co.
 *
 * CRITICAL FIX:
 * The old code returned JSON with the redirect URL but did NOT propagate
 * cookies. Supabase PKCE flow stores a `code_verifier` in cookies which
 * is needed later when /auth/callback exchanges the code for a session.
 *
 * FIX STRATEGY: Instead of returning JSON, we now REDIRECT directly.
 * The redirect response carries the Set-Cookie headers with the PKCE
 * code_verifier, so when the user returns to /auth/callback, the
 * verifier cookie is present and the code exchange works.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const provider = searchParams.get('provider') as Provider

        if (!provider || (provider !== 'google' && provider !== 'twitter')) {
            return NextResponse.json(
                { ok: false, error: 'Invalid provider.' },
                { status: 400 }
            )
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        // Collect cookies that Supabase sets (including PKCE code_verifier)
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
                    flowType: 'pkce',
                },
            }
        )

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
                skipBrowserRedirect: true, // We handle the redirect ourselves
            },
        })

        if (error) {
            console.error('[/api/auth/oauth] signInWithOAuth error:', error)
            return NextResponse.json(
                { ok: false, error: error.message },
                { status: 400 }
            )
        }

        if (!data?.url) {
            return NextResponse.json(
                { ok: false, error: 'Failed to generate OAuth URL.' },
                { status: 500 }
            )
        }

        // REDIRECT instead of returning JSON — this carries the PKCE cookies!
        const response = NextResponse.redirect(data.url, { status: 302 })

        cookiesToReturn.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (err) {
        console.error('[/api/auth/oauth] Unexpected error:', err)
        return NextResponse.json(
            { ok: false, error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
