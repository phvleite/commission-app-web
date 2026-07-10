import { Tenant } from '@/models/Tenant'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const validData = {
    name: 'Empresa ABC',
    legalName: 'Empresa ABC Comércio Ltda',
    slug: 'empresa-abc',
}

const validAddress = {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01001-000',
}

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('Tenant model', () => {
    it('cria um tenant válido sem endereço', async () => {
        const doc = await Tenant.create(validData)
        expect(doc._id).toBeDefined()
        expect(doc.active).toBe(true)
        expect(doc.address).toBeUndefined()
    })

    it('cria um tenant com endereço completo', async () => {
        const doc = await Tenant.create({ ...validData, address: validAddress })
        expect(doc.address?.city).toBe('São Paulo')
        expect(doc.address?.state).toBe('SP')
    })

    it('rejeita quando name está ausente', async () => {
        const { name: _, ...sem } = validData
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita quando legalName está ausente', async () => {
        const { legalName: _, ...sem } = validData
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita quando slug está ausente', async () => {
        const { slug: _, ...sem } = validData
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita slug duplicado', async () => {
        await Tenant.create(validData)
        await expect(Tenant.create({ ...validData, legalName: 'Outra Razão' })).rejects.toThrow()
    })

    it('rejeita estado com mais de 2 caracteres', async () => {
        await expect(
            Tenant.create({ ...validData, address: { ...validAddress, state: 'SPP' } }),
        ).rejects.toThrow()
    })

    it('rejeita endereço sem campos obrigatórios', async () => {
        await expect(
            Tenant.create({ ...validData, address: { street: 'Rua A' } }),
        ).rejects.toThrow()
    })
})
