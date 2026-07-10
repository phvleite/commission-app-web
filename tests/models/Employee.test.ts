import { Types } from 'mongoose'
import { Employee } from '@/models/Employee'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const sectorId = new Types.ObjectId()
const validData = { tenantId, name: 'João Silva', sectorId, admissionDate: new Date('2024-01-15') }

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('Employee model', () => {
    it('cria um colaborador válido com defaults', async () => {
        const doc = await Employee.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.active).toBe(true)
        expect(doc.dismissalDate).toBeUndefined()
    })

    it('rejeita quando tenantId está ausente', async () => {
        const { tenantId: _, ...sem } = validData
        await expect(Employee.create(sem)).rejects.toThrow()
    })

    it('rejeita quando name está ausente', async () => {
        const { name: _, ...sem } = validData
        await expect(Employee.create(sem)).rejects.toThrow()
    })

    it('rejeita quando sectorId está ausente', async () => {
        const { sectorId: _, ...sem } = validData
        await expect(Employee.create(sem)).rejects.toThrow()
    })

    it('rejeita quando admissionDate está ausente', async () => {
        const { admissionDate: _, ...sem } = validData
        await expect(Employee.create(sem)).rejects.toThrow()
    })

    it('aceita dismissalDate preenchida', async () => {
        const dismissalDate = new Date('2025-06-30')
        const doc = await Employee.create({ ...validData, dismissalDate, active: false })
        expect(doc.dismissalDate).toEqual(dismissalDate)
        expect(doc.active).toBe(false)
    })
})
