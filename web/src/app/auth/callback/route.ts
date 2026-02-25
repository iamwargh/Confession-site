import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

/**
 * AUTH CALLBACK — Handles ALL Supabase email verification & OAuth redirects.
 *
 * !! IMPORTANT !!
 * This route is EXCLUDED from proxy.ts matcher so it is NEVER intercepted.
 * The PKCE code in the URL is single-use. Any extra network call (like getUser())
 * before exchangeCodeForSession() can cause it to fail silently.
 *
 * Flows:
 * A. PKCE  → ?code=xxx          (signUp email confirmation, OAuth)
 * B. OTP   → ?token_hash=xxx    (legacy email templates, recovery)
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const { searchParams, origin } = requestUrl

    // Ensure no trailing slash
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '')

    try {
        const code = searchParams.get('code')
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type') as EmailOtpType | null
        const next = searchParams.get('next') ?? '/'

        console.log('[auth/callback] Incoming params:', {
            hasCode: !!code,
            codePreview: code ? code.substring(0, 20) + '...' : null,
            hasTokenHash: !!token_hash,
            type,
            next,
            siteUrl,
        })

        // ── FLOW A: PKCE code exchange ────────────────────────────────────────────
        // Used by: signUp email confirmation, OAuth (Google, Twitter)
        if (code) {
            // Create a response object FIRST so we can write session cookies into it
            const response = NextResponse.redirect(
                `${siteUrl}${next.startsWith('/') ? next : '/' + next}`
            )

            // Build Supabase client that writes cookies into our response object
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                response.cookies.set(name, value, options)
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

            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('[auth/callback] PKCE exchange error:', {
                    message: error.message,
                    status: error.status,
                })
                return NextResponse.redirect(
                    `${siteUrl}/login?error=${encodeURIComponent(
                        'Verification link expired or already used. Please sign up again.'
                    )}`
                )
            }

            console.log('[auth/callback] PKCE exchange success → redirecting to:', `${siteUrl}${next}`)
            return response
        }

        // ── FLOW B: OTP / token_hash ──────────────────────────────────────────────
        // Used by: legacy email templates, password reset
        if (token_hash && type) {
            const response = NextResponse.redirect(
                `${siteUrl}${type === 'recovery' ? '/reset-password' : next.startsWith('/') ? next : '/' + next}`
            )

            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                response.cookies.set(name, value, options)
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

            const { error } = await supabase.auth.verifyOtp({ token_hash, type })

            if (error) {
                console.error('[auth/callback] OTP verify error:', {
                    message: error.message,
                    status: error.status,
                })
                return NextResponse.redirect(
                    `${siteUrl}/login?error=${encodeURIComponent(
                        'Verification link expired or already used. Please try again.'
                    )}`
                )
            }

            console.log('[auth/callback] OTP verify success → type:', type)
            return response
        }

        // ── FLOW C: No params — log and redirect ──────────────────────────────────
        console.warn('[auth/callback] No code or token_hash in URL. searchParams:', {
            all: Object.fromEntries(searchParams.entries()),
            fullUrl: requestUrl.toString().substring(0, 200),
        })

        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('Invalid verification link. Please try again.')}`
        )

    } catch (err) {
        console.error('[auth/callback] CRITICAL ERROR:', err)
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
        )
    }
}