import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Tenant } from '@/models/Tenant'

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

        const payload = (await res.json()) as { data: { _id: string; slug: string } }
        expect(payload.data._id.toString()).toBe(tenant._id.toString())
        expect(payload.data.slug).toBe('empresa-a')
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

        const updated = await Tenant.findById(tenant._id).lean()
        expect(updated?.name).toBe('Empresa Atualizada')
        expect(updated?.legalName).toBe('Empresa Atualizada LTDA')
        expect(updated?.address?.city).toBe('Sao Paulo')
    })
})
