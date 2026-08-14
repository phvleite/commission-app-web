import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
    getInactivityCookieOptions,
    INACTIVITY_COOKIE_NAME,
    isInactivityExpired,
} from '@/lib/auth/inactivity'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/planos', '/saiba-mais']
const AUTH_SESSION_COOKIES = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
]

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) {
        return true
    }

    if (pathname.startsWith('/showcase')) {
        return true
    }

    if (pathname.startsWith('/pdf-templates')) {
        return true
    }

    if (pathname.startsWith('/api/auth')) {
        return true
    }

    return false
}

function getPlatformRole(authValue: unknown): string | undefined {
    if (!authValue || typeof authValue !== 'object') {
        return undefined
    }

    const candidate = authValue as {
        user?: { platformRole?: string }
        platformRole?: string
    }

    return candidate.user?.platformRole ?? candidate.platformRole
}

export default auth((req) => {
    const { nextUrl } = req
    const { pathname } = nextUrl

    if (isPublicPath(pathname)) {
        return NextResponse.next()
    }

    if (!req.auth) {
        const loginUrl = new URL('/login', nextUrl.origin)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    const platformRole = getPlatformRole(req.auth)
    const isPlatformAdminPath = pathname.startsWith('/platform-admin')
    const isDashboardPath = pathname.startsWith('/dashboard')

    if (isPlatformAdminPath && !platformRole) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
    }

    if (isDashboardPath && platformRole) {
        return NextResponse.redirect(new URL('/platform-admin', nextUrl.origin))
    }

    const cookieOptions = getInactivityCookieOptions(nextUrl.protocol === 'https:')
    const rawLastActivity = req.cookies.get(INACTIVITY_COOKIE_NAME)?.value
    const lastActivity = rawLastActivity ? Number(rawLastActivity) : Number.NaN

    if (isInactivityExpired(lastActivity)) {
        const loginUrl = new URL('/login', nextUrl.origin)
        loginUrl.searchParams.set('callbackUrl', `${pathname}${nextUrl.search}`)
        loginUrl.searchParams.set('reason', 'inactivity')

        const response = NextResponse.redirect(loginUrl)

        for (const cookieName of AUTH_SESSION_COOKIES) {
            response.cookies.set(cookieName, '', {
                ...cookieOptions,
                maxAge: 0,
            })
        }

        response.cookies.set(INACTIVITY_COOKIE_NAME, '', {
            ...cookieOptions,
            maxAge: 0,
        })

        return response
    }

    if (!rawLastActivity) {
        const response = NextResponse.next()
        response.cookies.set(INACTIVITY_COOKIE_NAME, String(Date.now()), cookieOptions)
        return response
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)',
    ],
}
