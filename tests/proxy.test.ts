jest.mock('@/auth', () => ({
    auth: (handler: (req: { nextUrl: URL; auth?: unknown }) => Response) => handler,
}))

import middleware, { config } from '@/proxy'

describe('proxy middleware', () => {
    it('allows access to public routes', () => {
        const response = middleware({
            nextUrl: new URL('http://localhost/login'),
            auth: null,
        })

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('redirects unauthenticated user to login with callbackUrl on protected route', () => {
        const response = middleware({
            nextUrl: new URL('http://localhost/dashboard/sales'),
            auth: null,
        })

        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get('location')).toBe(
            'http://localhost/login?callbackUrl=%2Fdashboard%2Fsales',
        )
    })

    it('allows authenticated user on protected route', () => {
        const response = middleware({
            nextUrl: new URL('http://localhost/dashboard/sales'),
            auth: { user: { id: 'u1' } },
        })

        expect(response.status).toBe(200)
        expect(response.headers.get('location')).toBeNull()
    })

    it('keeps expected matcher config', () => {
        expect(config.matcher).toEqual([
            '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
        ])
    })
})
