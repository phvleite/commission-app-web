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
import { GET, POST } from '@/app/api/sales/route'
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

    it('POST keeps only one sale when the client retries after a perceived network failure', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        generateCommissionsForDateMock.mockResolvedValue(undefined)

        const firstResponse = await POST(
            new Request('http://localhost/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2026-07-28T09:00:00.000Z',
                    value: 150,
                }),
            }),
        )

        expect(firstResponse.status).toBe(200)

        const retryResponse = await POST(
            new Request('http://localhost/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2026-07-28T18:30:00.000Z',
                    value: 150,
                }),
            }),
        )

        expect(retryResponse.status).toBe(400)
        await expect(retryResponse.json()).resolves.toEqual({
            error: 'Já existe uma venda registrada para esta data.',
        })

        const sales = await Sale.find({ tenantId }).lean()
        expect(sales).toHaveLength(1)
        expect(sales[0]?.value).toBe(15000)
    })

    it('GET sem filtros retorna todas as vendas do tenant', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)

        const now = new Date()
        const recentDate = new Date(now)
        recentDate.setDate(now.getDate() - 5)
        recentDate.setUTCHours(12, 0, 0, 0)

        const oldDate = new Date(now)
        oldDate.setDate(now.getDate() - 70)
        oldDate.setUTCHours(12, 0, 0, 0)

        await Sale.create({
            tenantId,
            date: recentDate,
            value: 10000,
            totalCommissionValue: 1000,
        })

        await Sale.create({
            tenantId,
            date: oldDate,
            value: 20000,
            totalCommissionValue: 2000,
        })

        const res = await GET(new Request('http://localhost/api/sales'))

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            sales: Array<{ value: number; date: string }>
        }

        expect(payload.sales).toHaveLength(2)
        expect(payload.sales.map((sale) => sale.value)).toEqual([10000, 20000])
    })

    it('GET com page retorna paginação de 50 itens com metadados', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)

        const baseDate = new Date('2026-01-01T12:00:00.000Z')

        await Promise.all(
            Array.from({ length: 55 }).map((_, index) => {
                const date = new Date(baseDate)
                date.setUTCDate(baseDate.getUTCDate() + index)
                return Sale.create({
                    tenantId,
                    date,
                    value: (index + 1) * 100,
                    totalCommissionValue: (index + 1) * 10,
                })
            }),
        )

        const res = await GET(new Request('http://localhost/api/sales?page=2&pageSize=50'))

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            sales: Array<{ value: number }>
            currentPage: number
            totalPages: number
            totalItems: number
            pageSize: number
        }

        expect(payload.currentPage).toBe(2)
        expect(payload.totalPages).toBe(2)
        expect(payload.totalItems).toBe(55)
        expect(payload.pageSize).toBe(50)
        expect(payload.sales).toHaveLength(5)
    })
})
