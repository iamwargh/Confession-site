import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(`username-check:${clientIp}`, { intervalMs: 60 * 1000, maxRequests: 60 })
    if (!rateLimit.allowed) {
        return NextResponse.json({ available: false, error: 'Too many requests. Please slow down.' }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
        return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 })
    }

    // Basic validation
    const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
    if (!usernameValid) {
        return NextResponse.json({ available: false, error: 'Invalid username format' }, { status: 400 })
    }

    // Prevent usage of reserved auto-generated pattern (user_ + 8 chars)
    if (/^user_[a-zA-Z0-9]{8}$/.test(username)) {
        return NextResponse.json({ available: false, error: 'This username format is reserved.' }, { status: 400 })
    }

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => request.cookies.getAll(),
                    setAll: () => { },
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            }
        )

        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .maybeSingle()

        if (error) {
            console.error('[username-check] check error:', error)
            return NextResponse.json({ available: false, error: 'Database error' }, { status: 500 })
        }

        if (data) {
            // Username is taken
            return NextResponse.json({ available: false })
        }

        return NextResponse.json({ available: true })
    } catch (err) {
        console.error('[username-check] catch error:', err)
        return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 })
    }
}
