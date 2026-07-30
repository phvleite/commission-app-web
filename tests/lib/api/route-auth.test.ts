jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'

const authMock = auth as unknown as jest.Mock

describe('route-auth helpers', () => {
    afterEach(() => {
        authMock.mockReset()
    })

    it('returns null when session has missing required user fields', async () => {
        authMock.mockResolvedValue({
            user: {
                id: 'u1',
                role: 'admin',
            },
        })

        await expect(getRouteSessionUser()).resolves.toBeNull()
    })

    it('returns normalized route user when session is complete', async () => {
        authMock.mockResolvedValue({
            user: {
                id: 'u1',
                tenantId: 't1',
                role: 'manager',
                email: 'manager@company.com',
                name: 'Manager',
            },
        })

        await expect(getRouteSessionUser()).resolves.toEqual({
            id: 'u1',
            tenantId: 't1',
            role: 'manager',
            email: 'manager@company.com',
            name: 'Manager',
        })
    })

    it('allows write only for admin and manager', () => {
        expect(canWrite('admin')).toBe(true)
        expect(canWrite('manager')).toBe(true)
        expect(canWrite('seller')).toBe(false)
    })
})
