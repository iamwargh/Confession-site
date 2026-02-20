import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Sign out route handler.
 * Called via form POST from the UI.
 */
export async function POST(request: Request) {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login`, {
        status: 302,
    })
}
