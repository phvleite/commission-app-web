export const INACTIVITY_COOKIE_NAME = 'last_activity_at'

const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 60

export function getInactivityTimeoutMs(): number {
    const rawValue = Number(process.env.AUTH_INACTIVITY_TIMEOUT_MINUTES)

    if (!Number.isFinite(rawValue) || rawValue <= 0) {
        return DEFAULT_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000
    }

    return Math.trunc(rawValue) * 60 * 1000
}

export function getInactivityCookieOptions(secure: boolean) {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    }
}

export function isInactivityExpired(lastActivityAt: number, now = Date.now()): boolean {
    if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
        return false
    }

    return now - lastActivityAt > getInactivityTimeoutMs()
}