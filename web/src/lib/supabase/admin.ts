import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client using the service role key.
 * USE WITH EXTREME CAUTION — this bypasses RLS entirely.
 * Only use for admin operations that need elevated privileges.
 */
export function createAdminClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
