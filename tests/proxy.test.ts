jest.mock('@/auth', () => ({
    auth: (handler: (req: { nextUrl: URL; auth?: unknown }) => Response) => handler,
}))

import middleware, { config } from '@/proxy'

function buildRequest(url: string, authValue: unknown, cookies?: Record<string, string>) {
    return {
        nextUrl: new URL(url),
        auth: authValue,
        cookies: {
            get: (name: string) => {
                const value = cookies?.[name]
                return value ? { value } : undefined
            },
        },
    }
}

describe('proxy middleware', () => {
    it('allows access to public routes', () => {
        const response = middleware(buildRequest('http://localhost/login', null))

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /saiba-mais as a public route', () => {
        const response = middleware(buildRequest('http://localhost/saiba-mais', null))

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to showcase assets as a public route', () => {
        const response = middleware(
            buildRequest(
                'http://localhost/showcase/situations/relatorio-situacoes-1785960660906.pdf',
                null,
            ),
        )

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('redirects unauthenticated user to login with callbackUrl on protected route', () => {
        const response = middleware(buildRequest('http://localhost/dashboard/sales', null))

        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get('location')).toBe(
            'http://localhost/login?callbackUrl=%2Fdashboard%2Fsales',
        )
    })

    it('allows authenticated user on protected route', () => {
        const response = middleware(
            buildRequest('http://localhost/dashboard/sales', { user: { id: 'u1' } }),
        )

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('redirects non-platform user away from /platform-admin', () => {
        const response = middleware(
            buildRequest('http://localhost/platform-admin', { user: { id: 'u1' } }),
        )

        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get('location')).toBe('http://localhost/dashboard')
    })

    it('redirects platform user away from /dashboard to /platform-admin', () => {
        const response = middleware(
            buildRequest('http://localhost/dashboard', {
                user: { id: 'u1', platformRole: 'platform_admin' },
            }),
        )

        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get('location')).toBe('http://localhost/platform-admin')
    })

    it('redirects authenticated user to login when inactivity timeout is exceeded', () => {
        const oldTimestamp = String(Date.now() - 1000 * 60 * 61)

        const response = middleware(
            buildRequest(
                'http://localhost/dashboard/sales?tab=list',
                { user: { id: 'u1' } },
                {
                    last_activity_at: oldTimestamp,
                },
            ),
        )

        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get('location')).toBe(
            'http://localhost/login?callbackUrl=%2Fdashboard%2Fsales%3Ftab%3Dlist&reason=inactivity',
        )
    })

    it('keeps expected matcher config', () => {
        expect(config.matcher).toEqual([
            '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)',
        ])
    })
})
