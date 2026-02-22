import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * MIDDLEWARE — Next.js 16 compatible.
 *
 * CRITICAL: /auth/* routes are EXCLUDED from this middleware.
 * The PKCE flow works by Supabase redirecting to /auth/callback with a ?code=
 * param. If middleware intercepts and calls getUser() before exchangeCodeForSession(),
 * it can interfere with the PKCE token. We must let /auth/* pass through freely.
 *
 * Route Protection Matrix:
 * ┌─────────────────────┬──────────┬───────┬──────────────┐
 * │ Route               │ Public   │ User  │ Admin/Super  │
 * ├─────────────────────┼──────────┼───────┼──────────────┤
 * │ /                   │ ✅       │ ✅    │ ✅           │
 * │ /trending           │ ✅       │ ✅    │ ✅           │
 * │ /confession/[id]    │ ✅       │ ✅    │ ✅           │
 * │ /login              │ ✅       │ redirect home │ redirect home │
 * │ /signup             │ ✅       │ redirect home │ redirect home │
 * │ /post               │ ❌       │ ✅    │ ✅           │
 * │ /my-confessions     │ ❌       │ ✅    │ ✅           │
 * │ /account/*          │ ❌       │ ✅    │ ✅           │
 * │ /admin/*            │ ❌       │ ❌    │ ✅           │
 * │ /superadmin/*       │ ❌       │ ❌    │ superadmin   │
 * │ /auth/*             │ ✅ FREE  │ ✅    │ ✅ (bypassed)│
 * └─────────────────────┴──────────┴───────┴──────────────┘
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/post',
    '/my-confessions',
    '/account',
]

// Routes that require admin role
const ADMIN_ROUTES = [
    '/admin',
]

// Routes that require superadmin role
const SUPERADMIN_ROUTES = [
    '/superadmin',
]

// Routes that should redirect to home if already logged in
const AUTH_ROUTES = [
    '/login',
    '/signup',
]

function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // ── CRITICAL: Let ALL /auth/* routes pass through WITHOUT any processing ──
    // This includes /auth/callback, /auth/confirm, etc.
    // The PKCE code exchange MUST happen without interference.
    if (pathname.startsWith('/auth/')) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: DO NOT remove this line. It refreshes the auth token.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ─────────────────────────────────────────────
    // 1. AUTH ROUTES: Redirect logged-in users away from login/signup
    // ─────────────────────────────────────────────
    if (user && matchesRoute(pathname, AUTH_ROUTES)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // ─────────────────────────────────────────────
    // 2. PROTECTED ROUTES: Require authentication
    // ─────────────────────────────────────────────
    const needsAuth = matchesRoute(pathname, PROTECTED_ROUTES)
    const needsAdmin = matchesRoute(pathname, ADMIN_ROUTES)
    const needsSuperAdmin = matchesRoute(pathname, SUPERADMIN_ROUTES)

    if ((needsAuth || needsAdmin || needsSuperAdmin) && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // ─────────────────────────────────────────────
    // 3. USER SUSPENSION CHECK
    // ─────────────────────────────────────────────
    if (user && (needsAuth || needsAdmin || needsSuperAdmin)) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_suspended, suspended_until, suspension_reason')
            .eq('id', user.id)
            .single()

        if (profile) {
            // Check if suspension has expired
            if (profile.is_suspended && profile.suspended_until) {
                const suspendedUntil = new Date(profile.suspended_until)
                if (suspendedUntil < new Date()) {
                    // Suspension expired — auto-unsuspend via RPC
                    await supabase.rpc('check_suspension_expired', { user_uuid: user.id })
                    // Continue — user is no longer suspended
                } else {
                    // Still suspended — redirect to suspended page
                    if (pathname !== '/suspended') {
                        const url = request.nextUrl.clone()
                        url.pathname = '/suspended'
                        return NextResponse.redirect(url)
                    }
                }
            } else if (profile.is_suspended) {
                // Permanently suspended
                if (pathname !== '/suspended') {
                    const url = request.nextUrl.clone()
                    url.pathname = '/suspended'
                    return NextResponse.redirect(url)
                }
            }

            // ─────────────────────────────────────────────
            // 4. ROLE-BASED ACCESS CONTROL
            // ─────────────────────────────────────────────

            // Admin routes require admin or superadmin role
            if (needsAdmin && profile.role !== 'admin' && profile.role !== 'superadmin') {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }

            // Superadmin routes require superadmin role only
            if (needsSuperAdmin && profile.role !== 'superadmin') {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - /auth/* (PKCE callback, email confirm, OAuth — must pass freely)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - Public image assets
         */
        '/((?!auth/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
