import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // In Route Handlers, cookies() IS writable — no try/catch needed.
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component context — proxy will handle session refresh.
                    }
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    )

    // Wrap getUser to catch timeouts/lock errors silently
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
    supabase.auth.getUser = async (...args) => {
        try {
            return await originalGetUser(...args)
        } catch (e) {
            console.error('[Supabase Server] getUser timeout/error:', e)
            return { data: { user: null }, error: e as any }
        }
    }

    return supabase
}
