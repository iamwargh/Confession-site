import { createClient } from '@supabase/supabase-js'

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.from('profiles').select('id, username').limit(10)
    return new Response(JSON.stringify(data, null, 2))
}
