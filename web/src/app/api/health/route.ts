import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint: /api/health
 * Used by uptime monitors, deployment pipelines, and status checks.
 * Does NOT expose internal database error details or secret values.
 */
export async function GET() {
    const startTime = Date.now()
    let dbStatus: 'connected' | 'unreachable' = 'unreachable'

    try {
        const supabase = await createClient()
        // Simple query without revealing data
        const { error } = await supabase.from('confessions').select('id', { head: true, count: 'exact' }).limit(1)
        if (!error) {
            dbStatus = 'connected'
        }
    } catch {
        dbStatus = 'unreachable'
    }

    const responseTimeMs = Date.now() - startTime

    const isHealthy = dbStatus === 'connected'

    return NextResponse.json(
        {
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
            services: {
                database: dbStatus,
            },
            latencyMs: responseTimeMs,
        },
        { status: isHealthy ? 200 : 503 }
    )
}

