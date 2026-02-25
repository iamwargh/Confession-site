import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/signup
 *
 * Server-side signup: username check + signUp().
 * Bypasses ISP-level blocking of *.supabase.co domains.
 *
 * CRITICAL FIX: Same cookie-collector pattern as login route.
 * Signup doesn't create a full session (email confirmation pending),
 * but Supabase may still set cookies we need to propagate.
 *
 * Body: { email: string, password: string, username: string }
 * Returns: { ok: true } on success
 *          { ok: false, error: string } on failure
 */
export async function POST(request: NextRequest) {
    try {
        const { email, password, username } = await request.json()

        // ── Server-side validation ────────────────────────────────────────────────
        if (!email || !password || !username) {
            return NextResponse.json(
                { ok: false, error: 'All fields are required.' },
                { status: 400 }
            )
        }

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        if (!emailValid) {
            return NextResponse.json(
                { ok: false, error: 'Please enter a valid email address.' },
                { status: 400 }
            )
        }

        const usernameClean = username.toLowerCase().trim()
        const usernameValid =
            usernameClean.length >= 3 &&
            usernameClean.length <= 20 &&
            /^[a-zA-Z0-9_]+$/.test(usernameClean)
        if (!usernameValid) {
            return NextResponse.json(
                { ok: false, error: 'Username must be 3–20 chars, letters/numbers/underscores only.' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { ok: false, error: 'Password must be at least 8 characters.' },
                { status: 400 }
            )
        }

        // Collect cookies to propagate back
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

        // ── Check username uniqueness ─────────────────────────────────────────────
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', usernameClean)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { ok: false, error: 'This username is already taken. Please choose another.' },
                { status: 409 }
            )
        }

        // ── Create the account ────────────────────────────────────────────────────
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        const { error: signupError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { username: usernameClean },
                emailRedirectTo: `${siteUrl}/auth/callback`,
            },
        })

        if (signupError) {
            console.error('[/api/auth/signup] signUp error:', signupError)

            if (signupError.message.includes('already registered')) {
                return NextResponse.json(
                    { ok: false, error: 'An account with this email already exists. Try logging in.' },
                    { status: 409 }
                )
            }
            if (
                signupError.message.includes('Database error saving new user') ||
                signupError.message.includes('Database error updating user')
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: 'This username is likely taken or there was a database issue. Please try another username.',
                    },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { ok: false, error: signupError.message },
                { status: 400 }
            )
        }

        // ── Build response with any cookies Supabase set ─────────────────────────
        const response = NextResponse.json({ ok: true })

        cookiesToReturn.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (err) {
        console.error('[/api/auth/signup] Unexpected error:', err)
        return NextResponse.json(
            { ok: false, error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
