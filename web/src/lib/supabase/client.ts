import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Wrap getUser to catch timeouts/lock errors silently
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
    supabase.auth.getUser = async (...args) => {
        try {
            return await originalGetUser(...args)
        } catch (e: any) {
            console.error('[Supabase Browser] getUser timeout/error:', e)
            return { data: { user: null }, error: e }
        }
    }

    return supabase
}
