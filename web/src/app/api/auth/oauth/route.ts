import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

/**
 * GET /api/auth/oauth?provider=[google|twitter]
 *
 * DIRECT OAuth — bypasses supabase.co entirely in the browser.
 *
 * OLD FLOW (broken by ISP):
 *   Browser → supabase.co/auth/v1/authorize → Google → supabase.co/callback → our app
 *   ❌ ISP blocks supabase.co
 *
 * NEW FLOW:
 *   Browser → accounts.google.com (direct) → our app/api/auth/callback/google → server-side Supabase
 *   ✅ Browser never visits supabase.co
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID     — from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — from Google Cloud Console (used in callback route)
 */

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const provider = searchParams.get('provider')
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

        // ── Google Direct OAuth ─────────────────────────────────────────────────
        if (provider === 'google') {
            const clientId = process.env.GOOGLE_CLIENT_ID
            if (!clientId) {
                console.error('[/api/auth/oauth] GOOGLE_CLIENT_ID env var is missing')
                return NextResponse.redirect(
                    `${siteUrl}/login?error=${encodeURIComponent('Google login is not configured. Please contact support.')}`
                )
            }

            // Generate nonce for security (Supabase signInWithIdToken verifies this)
            const rawNonce = randomBytes(16).toString('base64url')
            const hashedNonce = createHash('sha256').update(rawNonce).digest('hex')

            // Generate state for CSRF protection
            const state = randomBytes(16).toString('base64url')

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: `${siteUrl}/api/auth/callback/google`,
                response_type: 'code',
                scope: 'openid email profile',
                access_type: 'offline',
                prompt: 'consent',
                nonce: hashedNonce,
                state: state,
            })

            const response = NextResponse.redirect(
                `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
            )

            // Store raw nonce and state in httpOnly cookies for verification in callback
            const cookieOptions = {
                httpOnly: true,
                secure: true,
                sameSite: 'lax' as const,
                maxAge: 600, // 10 minutes
                path: '/',
            }

            response.cookies.set('google_oauth_nonce', rawNonce, cookieOptions)
            response.cookies.set('google_oauth_state', state, cookieOptions)

            return response
        }

        // ── Twitter/X ───────────────────────────────────────────────────────────
        if (provider === 'twitter') {
            // Twitter OAuth requires browser to visit supabase.co for callback,
            // which ISP blocks. Until direct Twitter OAuth is implemented,
            // redirect with a clear error message.
            return NextResponse.redirect(
                `${siteUrl}/login?error=${encodeURIComponent('X/Twitter login is temporarily unavailable due to network restrictions. Please use Google or email/password to log in.')}`
            )
        }

        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('Invalid login provider.')}`
        )
    } catch (err) {
        console.error('[/api/auth/oauth] Unexpected error:', err)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        return NextResponse.redirect(
            `${siteUrl}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
        )
    }
}
