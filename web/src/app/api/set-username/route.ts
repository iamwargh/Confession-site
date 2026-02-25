import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { username } = body

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
        if (!usernameValid) {
            return NextResponse.json({ error: 'Invalid username format. Use 3-20 letters, numbers, or underscores.' }, { status: 400 })
        }

        if (/^user_[a-zA-Z0-9]{8}$/.test(username)) {
            return NextResponse.json({ error: 'This username format is reserved.' }, { status: 400 })
        }

        let response = NextResponse.json({ success: true })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => request.cookies.getAll(),
                    setAll: (cookiesToSet) => {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        response = NextResponse.json({ success: true })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            }
        )

        let user = null;
        let userError = null;
        try {
            const { data, error } = await supabase.auth.getUser()
            user = data?.user || null;
            userError = error;
        } catch (e) {
            console.error('[set-username] Supabase getUser timeout:', e);
            userError = e;
        }

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Attempt to update the profile directly
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ username: username.toLowerCase().trim() })
            .eq('id', user.id)

        if (updateError) {
            console.error('[set-username] update error:', updateError)
            if (updateError.message.includes('unique') || updateError.code === '23505') {
                return NextResponse.json({ error: 'This username is already taken. Please choose another.' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Database error updating username. Try again.' }, { status: 500 })
        }

        // Also update the auth user metadata, which is good practice and syncs with the trigger if needed
        await supabase.auth.updateUser({
            data: { username: username.toLowerCase().trim() }
        })

        return response
    } catch (err) {
        console.error('[set-username] catch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
