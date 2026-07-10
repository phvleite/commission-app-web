import { Types } from 'mongoose'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const sectorId = new Types.ObjectId()
const validData = {
    tenantId,
    date: new Date('2026-07-01'),
    sectorId,
    appliedPercentage: 30,
    totalSectorValue: 3000,
    totalEmployees: 5,
    eligibleEmployees: 4,
}

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('SaleCommissionSector model', () => {
    it('cria um registro válido', async () => {
        const doc = await SaleCommissionSector.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.eligibleEmployees).toBe(4)
    })

    it('rejeita appliedPercentage acima de 100', async () => {
        await expect(
            SaleCommissionSector.create({ ...validData, appliedPercentage: 101 }),
        ).rejects.toThrow()
    })

    it('rejeita duplicata (tenantId + date + sectorId)', async () => {
        await SaleCommissionSector.create(validData)
        await expect(SaleCommissionSector.create(validData)).rejects.toThrow()
    })

    it('permite mesmo setor em datas diferentes', async () => {
        await SaleCommissionSector.create(validData)
        const doc = await SaleCommissionSector.create({
            ...validData,
            date: new Date('2026-07-02'),
        })
        expect(doc._id).toBeDefined()
    })
})
