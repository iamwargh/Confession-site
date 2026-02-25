import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/login
 *
 * Server-side email/password login.
 * Bypasses ISP-level blocking of *.supabase.co domains.
 *
 * CRITICAL FIX: We create the Supabase client with a custom cookie handler
 * that writes cookies directly onto the NextResponse object. This ensures
 * auth session cookies are actually sent back to the browser.
 *
 * Body: { email: string, password: string }
 * Returns: { ok: true } on success (with Set-Cookie headers)
 *          { ok: false, error: string } on failure
 */
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { ok: false, error: 'Email and password are required.' },
                { status: 400 }
            )
        }

        // We'll collect cookies to set on the final response
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

        // ── Attempt sign-in ───────────────────────────────────────────────────────
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (loginError) {
            if (loginError.message.includes('Email not confirmed')) {
                return NextResponse.json(
                    { ok: false, error: 'Please verify your email before logging in. Check your inbox.' },
                    { status: 401 }
                )
            }
            if (loginError.message.includes('Invalid login credentials')) {
                return NextResponse.json(
                    { ok: false, error: 'Wrong email or password. Please try again.' },
                    { status: 401 }
                )
            }
            return NextResponse.json(
                { ok: false, error: loginError.message },
                { status: 401 }
            )
        }

        if (!data.user) {
            return NextResponse.json(
                { ok: false, error: 'Login failed. Please try again.' },
                { status: 401 }
            )
        }

        // ── Suspension check ──────────────────────────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_suspended, suspended_until, suspension_reason')
            .eq('id', data.user.id)
            .single()

        if (profile?.is_suspended) {
            const isExpired =
                profile.suspended_until && new Date(profile.suspended_until) < new Date()

            if (isExpired) {
                // Auto-unsuspend via RPC
                await supabase.rpc('check_suspension_expired', { user_uuid: data.user.id })
                // Allow login to continue
            } else {
                // Still suspended — sign them out and return error
                await supabase.auth.signOut()
                const until = profile.suspended_until
                    ? ` until ${new Date(profile.suspended_until).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}`
                    : ' permanently'
                return NextResponse.json(
                    {
                        ok: false,
                        error: `Your account has been suspended${until}. Reason: ${profile.suspension_reason || 'Violation of terms.'}`,
                    },
                    { status: 403 }
                )
            }
        }

        // ── Build response with session cookies ──────────────────────────────────
        const response = NextResponse.json({ ok: true })

        // Write all collected cookies onto the response
        cookiesToReturn.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (err) {
        console.error('[/api/auth/login] Unexpected error:', err)
        return NextResponse.json(
            { ok: false, error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
