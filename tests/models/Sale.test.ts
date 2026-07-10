import { Types } from 'mongoose'
import { Sale } from '@/models/Sale'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const validData = {
    tenantId,
    date: new Date('2026-07-01'),
    value: 100000, // R$ 1.000,00 em centavos
    totalCommissionValue: 10000, // 10%
}

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('Sale model', () => {
    it('cria uma venda válida', async () => {
        const doc = await Sale.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.value).toBe(100000)
        expect(doc.totalCommissionValue).toBe(10000)
    })

    it('rejeita quando tenantId está ausente', async () => {
        const { tenantId: _, ...sem } = validData
        await expect(Sale.create(sem)).rejects.toThrow()
    })

    it('rejeita quando date está ausente', async () => {
        const { date: _, ...sem } = validData
        await expect(Sale.create(sem)).rejects.toThrow()
    })

    it('rejeita value negativo', async () => {
        await expect(Sale.create({ ...validData, value: -1 })).rejects.toThrow()
    })

    it('rejeita data duplicada no mesmo tenant', async () => {
        await Sale.create(validData)
        await expect(Sale.create(validData)).rejects.toThrow()
    })

    it('permite mesma data em tenants diferentes', async () => {
        const outroTenant = new Types.ObjectId()
        await Sale.create(validData)
        const doc = await Sale.create({ ...validData, tenantId: outroTenant })
        expect(doc._id).toBeDefined()
    })
})
