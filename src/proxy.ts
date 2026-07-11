import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const PUBLIC_ROUTES = ['/', '/login', '/signup']

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) {
        return true
    }

    if (pathname.startsWith('/api/auth')) {
        return true
    }

    return false
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

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
