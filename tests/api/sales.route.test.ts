import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Sale } from '@/models/Sale'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/services/commissions/generate', () => ({
    generateCommissionsForDate: jest.fn(),
}))

import { auth } from '@/auth'
import { POST } from '@/app/api/sales/route'
import { generateCommissionsForDate } from '@/services/commissions/generate'

const authMock = auth as unknown as jest.Mock
const generateCommissionsForDateMock = generateCommissionsForDate as jest.MockedFunction<
    typeof generateCommissionsForDate
>

function setSession(tenantId: string) {
    authMock.mockResolvedValue({
        user: {
            id: new Types.ObjectId().toString(),
            tenantId,
            role: 'admin',
            email: 'admin@company.com',
            name: 'Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API sales routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        generateCommissionsForDateMock.mockReset()
        await clearTestDB()
    })

    it('POST removes the sale when commission generation fails', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        generateCommissionsForDateMock.mockRejectedValueOnce(new Error('boom'))

        const res = await POST(
            new Request('http://localhost/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2026-07-28T12:00:00.000Z',
                    value: 100,
                }),
            }),
        )

        expect(res.status).toBe(500)

        const sale = await Sale.findOne({
            tenantId,
            date: new Date('2026-07-28T12:00:00.000Z'),
        }).lean()
        expect(sale).toBeNull()
    })
})
