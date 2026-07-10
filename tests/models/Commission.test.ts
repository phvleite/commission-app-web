import { Types } from 'mongoose'
import { Commission } from '@/models/Commission'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const employeeId = new Types.ObjectId()
const sectorId = new Types.ObjectId()

const validData = {
    tenantId,
    date: new Date('2026-07-01'),
    employeeId,
    sectorId,
    situation: 'Apto',
    sectorValue: 5000,
    employeeValue: 2500,
    eligibleCount: 2,
    totalCount: 3,
}

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('Commission model', () => {
    it('cria uma comissão válida', async () => {
        const doc = await Commission.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.situation).toBe('Apto')
        expect(doc.employeeValue).toBe(2500)
    })

    it('rejeita quando tenantId está ausente', async () => {
        const { tenantId: _, ...sem } = validData
        await expect(Commission.create(sem)).rejects.toThrow()
    })

    it('rejeita quando employeeId está ausente', async () => {
        const { employeeId: _, ...sem } = validData
        await expect(Commission.create(sem)).rejects.toThrow()
    })

    it('rejeita quando sectorId está ausente', async () => {
        const { sectorId: _, ...sem } = validData
        await expect(Commission.create(sem)).rejects.toThrow()
    })

    it('rejeita quando situation está ausente', async () => {
        const { situation: _, ...sem } = validData
        await expect(Commission.create(sem)).rejects.toThrow()
    })

    it('rejeita employeeValue negativo', async () => {
        await expect(Commission.create({ ...validData, employeeValue: -1 })).rejects.toThrow()
    })

    it('rejeita duplicata (tenantId + date + employeeId)', async () => {
        await Commission.create(validData)
        await expect(Commission.create(validData)).rejects.toThrow()
    })

    it('permite mesmo colaborador em datas diferentes', async () => {
        await Commission.create(validData)
        const doc = await Commission.create({ ...validData, date: new Date('2026-07-02') })
        expect(doc._id).toBeDefined()
    })
})
