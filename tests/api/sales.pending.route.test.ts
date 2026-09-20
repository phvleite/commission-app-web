import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Sale } from '@/models/Sale'
import { CommissionProcess } from '@/models/CommissionProcess'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/services/commissions/generate', () => ({
    generateCommissionsForDate: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/sales/pending/route'
import { generateCommissionsForDate } from '@/services/commissions/generate'

const authMock = auth as unknown as jest.Mock
const generateMock = generateCommissionsForDate as jest.MockedFunction<
    typeof generateCommissionsForDate
>

function setSession(tenantId: string) {
    authMock.mockResolvedValue({
        user: { id: new Types.ObjectId().toString(), tenantId, role: 'admin' },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API sales pending route', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        generateMock.mockReset()
        await clearTestDB()
    })

    it('does not allow recovery while processing is recent', async () => {
        const tenantId = new Types.ObjectId().toString()
        const date = new Date('2026-09-17T00:00:00.000Z')
        setSession(tenantId)
        await Sale.create({ tenantId, date, value: 10000, totalCommissionValue: 1000 })
        await CommissionProcess.create({
            tenantId,
            date,
            status: 'processing',
            startedAt: new Date(),
        })

        const response = await GET()
        const payload = await response.json()

        expect(payload.pending).toMatchObject({ status: 'processing', recoverable: false })
    })

    it('completes an abandoned sale without creating another sale', async () => {
        const tenantId = new Types.ObjectId().toString()
        const date = new Date('2026-09-16T00:00:00.000Z')
        setSession(tenantId)
        generateMock.mockResolvedValue(undefined)
        await Sale.create({ tenantId, date, value: 10000, totalCommissionValue: 1000 })
        await CommissionProcess.create({
            tenantId,
            date,
            status: 'processing',
            startedAt: new Date(Date.now() - 180_000),
        })

        const response = await POST(
            new Request('http://localhost/api/sales/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete', date: '2026-09-16' }),
            }),
        )

        expect(response.status).toBe(200)
        expect(generateMock).toHaveBeenCalledWith(tenantId, date)
        await expect(Sale.countDocuments({ tenantId, date })).resolves.toBe(1)
    })

    it('discards an abandoned sale and its process', async () => {
        const tenantId = new Types.ObjectId().toString()
        const date = new Date('2026-09-15T00:00:00.000Z')
        setSession(tenantId)
        await Sale.create({ tenantId, date, value: 10000, totalCommissionValue: 1000 })
        await CommissionProcess.create({
            tenantId,
            date,
            status: 'network_lost',
            startedAt: new Date(),
        })

        const response = await POST(
            new Request('http://localhost/api/sales/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'discard', date: '2026-09-15' }),
            }),
        )

        expect(response.status).toBe(200)
        await expect(Sale.countDocuments({ tenantId, date })).resolves.toBe(0)
        await expect(CommissionProcess.countDocuments({ tenantId, date })).resolves.toBe(0)
    })
})
