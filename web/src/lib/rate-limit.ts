/**
 * In-memory sliding-window rate limiter for server routes.
 * Suitable for serverless / edge instances to prevent automated brute-force attacks.
 */

interface RateLimitRecord {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, record] of rateLimitStore.entries()) {
            if (record.resetTime < now) {
                rateLimitStore.delete(key)
            }
        }
    }, 5 * 60 * 1000).unref?.()
}

export interface RateLimitOptions {
    intervalMs: number
    maxRequests: number
}

export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = { intervalMs: 60 * 1000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    if (!record || record.resetTime < now) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + options.intervalMs,
        })
        return {
            allowed: true,
            remaining: options.maxRequests - 1,
            resetInMs: options.intervalMs,
        }
    }

    if (record.count >= options.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetInMs: Math.max(0, record.resetTime - now),
        }
    }

    record.count += 1
    return {
        allowed: true,
        remaining: options.maxRequests - record.count,
        resetInMs: Math.max(0, record.resetTime - now),
    }
}

/**
 * Extracts a client IP from NextRequest headers safely
 */
export function getClientIp(headers: Headers): string {
    const forwardedFor = headers.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }
    const realIp = headers.get('x-real-ip')
    if (realIp) {
        return realIp.trim()
    }
    return '127.0.0.1'
}

