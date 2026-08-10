import { Tenant } from '@/models/Tenant'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { DEFAULT_SERVICE_PLAN_CODE, getServicePlan } from '@/lib/service-plans'

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
        expect(doc.planCode).toBe(DEFAULT_SERVICE_PLAN_CODE)
        expect(doc.maxUsers).toBe(getServicePlan(DEFAULT_SERVICE_PLAN_CODE).maxUsers)
        expect(doc.discounts).toEqual([])
        expect(doc.billingStatus).toBe('pending')
        expect(doc.nextBillingAt).toBeUndefined()
        expect(doc.address).toBeUndefined()
    })

    it('cria tenant com novos dados de cadastro da empresa', async () => {
        const nextBillingAt = new Date('2026-09-05T00:00:00.000Z')
        const doc = await Tenant.create({
            ...validData,
            slug: 'empresa-xyz',
            cnpj: '12ABC34501DE35',
            phone: '(11) 99999-0000',
            email: 'contato@empresa.com',
            planCode: 'plan_50',
            discounts: [{ code: 'abrasel', percentage: 5, isAbrasel: true }],
            billingStatus: 'active',
            nextBillingAt,
            maxUsers: 5,
        })

        expect(doc.cnpj).toBe('12ABC34501DE35')
        expect(doc.phone).toBe('(11) 99999-0000')
        expect(doc.email).toBe('contato@empresa.com')
        expect(doc.planCode).toBe('plan_50')
        expect(doc.discounts.map((discount) => discount.toObject())).toEqual([
            { code: 'abrasel', percentage: 5, isAbrasel: true },
        ])
        expect(doc.billingStatus).toBe('active')
        expect(doc.nextBillingAt?.toISOString()).toBe(nextBillingAt.toISOString())
        expect(doc.maxUsers).toBe(5)
    })

    it('cria um tenant com endereço completo', async () => {
        const doc = await Tenant.create({ ...validData, address: validAddress })
        expect(doc.address?.city).toBe('São Paulo')
        expect(doc.address?.state).toBe('SP')
    })

    it('rejeita quando name está ausente', async () => {
        const sem = { ...validData }
        delete sem.name
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita quando legalName está ausente', async () => {
        const sem = { ...validData }
        delete sem.legalName
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita quando slug está ausente', async () => {
        const sem = { ...validData }
        delete sem.slug
        await expect(Tenant.create(sem)).rejects.toThrow()
    })

    it('rejeita slug duplicado', async () => {
        await Tenant.create(validData)
        await expect(Tenant.create({ ...validData, legalName: 'Outra Razão' })).rejects.toThrow()
    })

    it('rejeita planCode invalido', async () => {
        await expect(
            Tenant.create({ ...validData, slug: 'empresa-plan', planCode: 'plano_invalido' }),
        ).rejects.toThrow()
    })

    it('rejeita desconto com percentual invalido', async () => {
        await expect(
            Tenant.create({
                ...validData,
                slug: 'empresa-desc',
                discounts: [{ code: 'abrasel', percentage: 101, isAbrasel: true }],
            }),
        ).rejects.toThrow()
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
