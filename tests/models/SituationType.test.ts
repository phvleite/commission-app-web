import { Types } from 'mongoose'
import { SituationType } from '@/models/SituationType'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('SituationType model', () => {
    it('cria um tipo de situação válido', async () => {
        const doc = await SituationType.create({ tenantId, description: 'Férias' })
        expect(doc._id).toBeDefined()
        expect(doc.active).toBe(true)
    })

    it('rejeita quando tenantId está ausente', async () => {
        await expect(SituationType.create({ description: 'Férias' })).rejects.toThrow()
    })

    it('rejeita quando description está ausente', async () => {
        await expect(SituationType.create({ tenantId })).rejects.toThrow()
    })

    it('rejeita descrição duplicada no mesmo tenant', async () => {
        await SituationType.create({ tenantId, description: 'Afastamento' })
        await expect(
            SituationType.create({ tenantId, description: 'Afastamento' }),
        ).rejects.toThrow()
    })

    it('permite mesma descrição em tenants diferentes', async () => {
        const outroTenant = new Types.ObjectId()
        await SituationType.create({ tenantId, description: 'Férias' })
        const doc = await SituationType.create({ tenantId: outroTenant, description: 'Férias' })
        expect(doc._id).toBeDefined()
    })
})
