import { Types } from 'mongoose'
import { Sector } from '@/models/Sector'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const validData = { tenantId, name: 'Vendas', percentage: 30 }

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('Sector model', () => {
    it('cria um setor válido com defaults', async () => {
        const doc = await Sector.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.active).toBe(true)
        expect(doc.isMeritocracia).toBe(false)
    })

    it('rejeita quando tenantId está ausente', async () => {
        await expect(Sector.create({ name: 'Vendas', percentage: 30 })).rejects.toThrow()
    })

    it('rejeita quando name está ausente', async () => {
        await expect(Sector.create({ tenantId, percentage: 30 })).rejects.toThrow()
    })

    it('rejeita quando percentage está ausente', async () => {
        await expect(Sector.create({ tenantId, name: 'Vendas' })).rejects.toThrow()
    })

    it('rejeita percentage acima de 100', async () => {
        await expect(Sector.create({ ...validData, percentage: 101 })).rejects.toThrow()
    })

    it('rejeita percentage negativo', async () => {
        await expect(Sector.create({ ...validData, percentage: -1 })).rejects.toThrow()
    })

    it('rejeita nome duplicado no mesmo tenant', async () => {
        await Sector.create(validData)
        await expect(Sector.create(validData)).rejects.toThrow()
    })

    it('permite mesmo nome em tenants diferentes', async () => {
        const outroTenant = new Types.ObjectId()
        await Sector.create(validData)
        const doc = await Sector.create({ ...validData, tenantId: outroTenant })
        expect(doc._id).toBeDefined()
    })

    it('aceita isMeritocracia = true', async () => {
        const doc = await Sector.create({ ...validData, isMeritocracia: true })
        expect(doc.isMeritocracia).toBe(true)
    })
})
