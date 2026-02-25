import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/auth/callback/google
 *
 * Handles the Google OAuth callback DIRECTLY — no supabase.co in the browser.
 *
 * Flow:
 * 1. Google redirects here with ?code=xxx&state=xxx
 * 2. We exchange the code for tokens with Google (server-side)
 * 3. We call Supabase signInWithIdToken with the Google ID token (server-side)
 * 4. Supabase creates/finds the user and returns a session
 * 5. We set session cookies and redirect to home
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   NEXT_PUBLIC_SITE_URL
 */

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

    // ── Handle Google errors (user cancelled, etc.) ─────────────────────────
    if (errorParam) {
        console.warn('[Google OAuth callback] Google returned error:', errorParam)
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('Google login was cancelled or failed. Please try again.')}`
        )
    }

    if (!code) {
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('No authorization code received from Google.')}`
        )
    }

    // ── Verify CSRF state ───────────────────────────────────────────────────
    const savedState = request.cookies.get('google_oauth_state')?.value
    if (!savedState || savedState !== state) {
        console.error('[Google OAuth callback] State mismatch:', { saved: savedState, received: state })
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('Security verification failed. Please try logging in again.')}`
        )
    }

    // ── Read the raw nonce from cookie ───────────────────────────────────────
    const rawNonce = request.cookies.get('google_oauth_nonce')?.value

    try {
        // ── Step 1: Exchange Google code for tokens (server-side) ────────────
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${siteUrl}/api/auth/callback/google`,
                grant_type: 'authorization_code',
            }),
        })

        const tokens = await tokenRes.json()

        if (tokens.error) {
            console.error('[Google OAuth callback] Token exchange error:', tokens)
            return NextResponse.redirect(
                `${siteUrl}/login?error=${encodeURIComponent('Failed to verify Google login. Please try again.')}`
            )
        }

        if (!tokens.id_token) {
            console.error('[Google OAuth callback] No id_token in response:', Object.keys(tokens))
            return NextResponse.redirect(
                `${siteUrl}/login?error=${encodeURIComponent('Google did not return required credentials. Please try again.')}`
            )
        }

        console.log('[Google OAuth callback] Token exchange successful, signing in with Supabase...')

        // ── Step 2: Sign in to Supabase with the Google ID token ────────────
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

        const signInPayload: {
            provider: 'google'
            token: string
            nonce?: string
        } = {
            provider: 'google',
            token: tokens.id_token,
        }

        // Only include nonce if we have one (for security verification)
        if (rawNonce) {
            signInPayload.nonce = rawNonce
        }

        const { data, error: signInError } = await supabase.auth.signInWithIdToken(signInPayload)

        if (signInError) {
            console.error('[Google OAuth callback] signInWithIdToken error:', signInError)
            return NextResponse.redirect(
                `${siteUrl}/login?error=${encodeURIComponent(signInError.message || 'Failed to create session. Please try again.')}`
            )
        }

        if (!data.user) {
            console.error('[Google OAuth callback] No user returned from signInWithIdToken')
            return NextResponse.redirect(
                `${siteUrl}/login?error=${encodeURIComponent('Login failed. Please try again.')}`
            )
        }

        console.log('[Google OAuth callback] Login successful for user:', data.user.id)

        // ── Step 3: Build redirect response with session cookies ────────────
        const response = NextResponse.redirect(`${siteUrl}/`)

        // Set all session cookies from Supabase
        cookiesToReturn.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        // Clean up OAuth-specific cookies
        response.cookies.delete('google_oauth_nonce')
        response.cookies.delete('google_oauth_state')

        return response
    } catch (err) {
        console.error('[Google OAuth callback] Unexpected error:', err)
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('An unexpected error occurred during Google login. Please try again.')}`
        )
    }
}
