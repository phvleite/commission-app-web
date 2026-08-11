import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { getEffectiveMonthlyPriceCents, getServicePlan } from '@/lib/service-plans'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, PATCH } from '@/app/api/company/route'

const authMock = auth as unknown as jest.Mock

function setSession(tenantId: string, role: 'admin' | 'manager' | 'seller' = 'admin') {
    authMock.mockResolvedValue({
        user: {
            id: new Types.ObjectId().toString(),
            tenantId,
            role,
            email: 'admin@company.com',
            name: 'Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API company route', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('GET retorna 401 sem autenticacao', async () => {
        authMock.mockResolvedValue(null)

        const res = await GET()
        expect(res.status).toBe(401)
    })

    it('GET retorna empresa do tenant autenticado', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'manager')

        const res = await GET()
        expect(res.status).toBe(200)

        const payload = (await res.json()) as {
            data: { _id: string; slug: string; effectiveMonthlyPriceCents: number }
        }
        expect(payload.data._id.toString()).toBe(tenant._id.toString())
        expect(payload.data.slug).toBe('empresa-a')
        expect(payload.data.effectiveMonthlyPriceCents).toBe(
            getEffectiveMonthlyPriceCents('plan_20'),
        )
    })

    it('PATCH bloqueia seller para editar empresa', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'seller')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Nova', legalName: 'Nova LTDA' }),
            }),
        )

        expect(res.status).toBe(403)
    })

    it('PATCH atualiza empresa e endereco', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa Atualizada',
                    legalName: 'Empresa Atualizada LTDA',
                    cnpj: '12.ABC.345/01DE-35',
                    phone: '(11) 97777-6666',
                    email: 'contato@empresa-a.com',
                    maxUsers: 3,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-a.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                        password: 'Senha@123',
                        passwordConfirmation: 'Senha@123',
                    },
                    address: {
                        street: 'Rua A',
                        number: '10',
                        neighborhood: 'Centro',
                        city: 'Sao Paulo',
                        state: 'SP',
                        zipCode: '01000-000',
                    },
                }),
            }),
        )

        expect(res.status).toBe(200)

        const payload = (await res.json()) as {
            data: { effectiveMonthlyPriceCents: number }
        }

        const updated = await Tenant.findById(tenant._id).lean()
        expect(updated?.name).toBe('Empresa Atualizada')
        expect(updated?.legalName).toBe('Empresa Atualizada LTDA')
        expect(updated?.cnpj).toBe('12ABC34501DE35')
        expect(updated?.responsibleUserId).toBeDefined()
        expect(updated?.phone).toBe('(11) 97777-6666')
        expect(updated?.email).toBe('contato@empresa-a.com')
        expect(updated?.maxUsers).toBe(getServicePlan('plan_20').maxUsers)
        expect(updated?.address?.city).toBe('Sao Paulo')
        expect(payload.data.effectiveMonthlyPriceCents).toBe(
            getEffectiveMonthlyPriceCents(updated?.planCode, updated?.monthlyPriceOverrideCents),
        )

        const responsible = await User.findOne({
            _id: updated?.responsibleUserId,
            tenantId: tenant._id,
        }).lean()
        expect(responsible?.name).toBe('Ana Gestora')
        expect(responsible?.email).toBe('ana@empresa-a.com')
        expect(responsible?.cpf).toBe('52998224725')
        expect(responsible?.phone).toBe('(11) 98888-7777')
    })

    it('PATCH rejeita CNPJ invalido', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    cnpj: '12.ABC.345/01DE-00',
                    maxUsers: 3,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-a.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                        password: 'Senha@123',
                        passwordConfirmation: 'Senha@123',
                    },
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Informe um CNPJ valido.')
    })

    it('PATCH bloqueia CNPJ que ja pertence a outro tenant', async () => {
        const tenantA = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
            cnpj: '12ABC34501DE35',
        })

        const tenantB = await Tenant.create({
            name: 'Empresa B',
            legalName: 'Empresa B LTDA',
            slug: 'empresa-b',
        })

        setSession(tenantB._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa B',
                    legalName: 'Empresa B LTDA',
                    cnpj: '12.ABC.345/01DE-35',
                    maxUsers: 3,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-b.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                        password: 'Senha@123',
                        passwordConfirmation: 'Senha@123',
                    },
                }),
            }),
        )

        expect(tenantA).toBeDefined()
        expect(res.status).toBe(409)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Ja existe empresa com este CNPJ.')
    })

    it("PATCH rejeita CNPJ curto como '1'", async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    cnpj: '1',
                    maxUsers: 3,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-a.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                        password: 'Senha@123',
                        passwordConfirmation: 'Senha@123',
                    },
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Informe um CNPJ valido.')
    })

    it('PATCH ignora maxUsers manual e preserva o limite derivado do plano', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa Atualizada',
                    legalName: 'Empresa Atualizada LTDA',
                    maxUsers: 0,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-a.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                        password: 'Senha@123',
                        passwordConfirmation: 'Senha@123',
                    },
                }),
            }),
        )

        expect(res.status).toBe(200)
        const updated = await Tenant.findById(tenant._id).lean()
        expect(updated?.maxUsers).toBe(getServicePlan('plan_20').maxUsers)
    })

    it('PATCH exige senha do responsavel no primeiro cadastro', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setSession(tenant._id.toString(), 'admin')

        const res = await PATCH(
            new Request('http://localhost/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    maxUsers: 3,
                    responsible: {
                        name: 'Ana Gestora',
                        email: 'ana@empresa-a.com',
                        cpf: '529.982.247-25',
                        phone: '(11) 98888-7777',
                    },
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe(
            'Defina a senha do responsavel para concluir o cadastro de acesso.',
        )
    })
})
