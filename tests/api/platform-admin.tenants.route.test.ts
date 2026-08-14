import { Types } from 'mongoose'
import { auth } from '@/auth'
import { GET, PUT } from '@/app/api/platform-admin/tenants/route'
import { getEffectiveMonthlyPriceCents, getServicePlan } from '@/lib/service-plans'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Tenant } from '@/models/Tenant'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

const authMock = auth as unknown as jest.Mock

function setPlatformSession(
    platformRole?: 'platform_owner' | 'platform_admin' | 'platform_auditor',
) {
    authMock.mockResolvedValue({
        user: {
            id: new Types.ObjectId().toString(),
            name: 'Platform User',
            email: 'admin@commission.com.br',
            role: 'admin',
            platformRole,
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API platform-admin tenants route', () => {
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

    it('GET lista tenants com preco efetivo resolvido', async () => {
        await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
            planCode: 'plan_50',
            monthlyPriceOverrideCents: 19990,
        })

        setPlatformSession('platform_auditor')

        const res = await GET()
        expect(res.status).toBe(200)

        const payload = (await res.json()) as {
            data: Array<{
                slug: string
                planCode: string
                maxUsers: number
                effectiveMonthlyPriceCents: number
            }>
        }

        expect(payload.data).toHaveLength(1)
        expect(payload.data[0]).toMatchObject({
            slug: 'empresa-a',
            planCode: 'plan_50',
            maxUsers: getServicePlan('plan_50').maxUsers,
            effectiveMonthlyPriceCents: 19990,
        })
    })

    it('PUT atualiza configuracoes comerciais do tenant', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setPlatformSession('platform_admin')

        const res = await PUT(
            new Request('http://localhost/api/platform-admin/tenants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tenant._id.toString(),
                    planCode: 'plan_50',
                    billingStatus: 'active',
                    nextBillingAt: '2026-09-10',
                    monthlyPriceOverrideCents: 19990,
                    discounts: [{ code: 'abrasel', percentage: 5, isAbrasel: true }],
                }),
            }),
        )

        expect(res.status).toBe(200)

        const payload = (await res.json()) as {
            data: {
                planCode: string
                billingStatus: string
                maxUsers: number
                monthlyPriceOverrideCents?: number
                effectiveMonthlyPriceCents: number
                discounts: Array<{ code: string; percentage: number; isAbrasel?: boolean }>
            }
        }

        expect(payload.data.planCode).toBe('plan_50')
        expect(payload.data.billingStatus).toBe('active')
        expect(payload.data.maxUsers).toBe(getServicePlan('plan_50').maxUsers)
        expect(payload.data.monthlyPriceOverrideCents).toBe(19990)
        expect(payload.data.effectiveMonthlyPriceCents).toBe(19990)
        expect(payload.data.discounts).toEqual([
            { code: 'abrasel', percentage: 5, isAbrasel: true },
        ])

        const updated = await Tenant.findById(tenant._id).lean()
        expect(updated?.planCode).toBe('plan_50')
        expect(updated?.billingStatus).toBe('active')
        expect(updated?.maxUsers).toBe(getServicePlan('plan_50').maxUsers)
        expect(updated?.monthlyPriceOverrideCents).toBe(19990)
        expect(
            getEffectiveMonthlyPriceCents(updated?.planCode, updated?.monthlyPriceOverrideCents),
        ).toBe(19990)
    })

    it('PUT rejeita corpo com tipos invalidos para campos obrigatorios', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setPlatformSession('platform_admin')

        const res = await PUT(
            new Request('http://localhost/api/platform-admin/tenants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tenant._id.toString(),
                    planCode: 123,
                    billingStatus: 'active',
                    discounts: [],
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('planCode deve ser uma string valida.')
    })

    it('PUT bloqueia platform_auditor', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a',
        })

        setPlatformSession('platform_auditor')

        const res = await PUT(
            new Request('http://localhost/api/platform-admin/tenants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tenant._id.toString(),
                    planCode: 'plan_50',
                    billingStatus: 'active',
                    discounts: [],
                }),
            }),
        )

        expect(res.status).toBe(403)
    })
})
