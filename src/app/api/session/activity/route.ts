import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getInactivityCookieOptions, INACTIVITY_COOKIE_NAME } from '@/lib/auth/inactivity'

function touchActivityCookie(request: Request): NextResponse {
    const response = NextResponse.json({ ok: true })
    const isSecure = new URL(request.url).protocol === 'https:'

    response.cookies.set(
        INACTIVITY_COOKIE_NAME,
        String(Date.now()),
        getInactivityCookieOptions(isSecure),
    )

    return response
}

export async function POST(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return touchActivityCookie(request)
}