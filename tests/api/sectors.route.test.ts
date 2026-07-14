import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Sector } from '@/models/Sector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/sectors/route'
import { PATCH, DELETE } from '@/app/api/sectors/[id]/route'

const authMock = auth as unknown as jest.Mock

function setSession(tenantId: string, role: 'admin' | 'manager' | 'seller' = 'admin') {
    authMock.mockResolvedValue({
        user: {
            id: new Types.ObjectId().toString(),
            tenantId,
            role,
            email: 'test@company.com',
            name: 'Test User',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API sectors routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('GET retorna 401 sem autenticacao', async () => {
        authMock.mockResolvedValue(null)

        const res = await GET(new Request('http://localhost/api/sectors'))
        expect(res.status).toBe(401)
    })

    it('POST cria setor para tenant autenticado', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'admin')

        const res = await POST(
            new Request('http://localhost/api/sectors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Vendas', percentage: 30 }),
            }),
        )

        expect(res.status).toBe(201)
        const payload = (await res.json()) as { data: { tenantId: string; name: string } }
        expect(payload.data.name).toBe('Vendas')

        const dbSector = await Sector.findOne({ name: 'Vendas' }).lean()
        expect(dbSector?.tenantId.toString()).toBe(tenantId)
    })

    it('POST bloqueia seller sem permissao de escrita', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'seller')

        const res = await POST(
            new Request('http://localhost/api/sectors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Vendas', percentage: 30 }),
            }),
        )

        expect(res.status).toBe(403)
    })

    it('GET lista somente setores do tenant autenticado', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()

        await Sector.create({ tenantId: tenantA, name: 'A', percentage: 10 })
        await Sector.create({ tenantId: tenantB, name: 'B', percentage: 20 })

        setSession(tenantA.toString(), 'manager')

        const res = await GET(new Request('http://localhost/api/sectors'))
        expect(res.status).toBe(200)

        const payload = (await res.json()) as { data: Array<{ name: string }> }
        expect(payload.data.some((item) => item.name === 'A')).toBe(true)
        expect(payload.data.some((item) => item.name === 'B')).toBe(false)
    })

    it('GET nao cria setor MERITOCRACIA automaticamente', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'manager')

        const res = await GET(new Request('http://localhost/api/sectors?includeInactive=true'))
        expect(res.status).toBe(200)

        const meritocracia = await Sector.findOne({
            tenantId,
            isMeritocracia: true,
            name: 'MERITOCRACIA',
        }).lean()

        expect(meritocracia).toBeNull()
    })

    it('POST bloqueia novo setor comum quando meritocracia esta ativa', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'admin')

        await Sector.create({
            tenantId,
            name: 'MERITOCRACIA',
            percentage: 0,
            active: true,
            isMeritocracia: true,
        })

        const res = await POST(
            new Request('http://localhost/api/sectors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Comercial', percentage: 30 }),
            }),
        )

        expect(res.status).toBe(409)
    })

    it('PATCH atualiza setor do tenant', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Original', percentage: 25 })

        setSession(tenantId.toString(), 'admin')

        const res = await PATCH(
            new Request(`http://localhost/api/sectors/${sector._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Atualizado', percentage: 40 }),
            }),
            { params: Promise.resolve({ id: sector._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const updated = await Sector.findById(sector._id).lean()
        expect(updated?.name).toBe('Atualizado')
        expect(updated?.percentage).toBe(40)
    })

    it('DELETE inativa setor (soft delete)', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({
            tenantId,
            name: 'Suporte',
            percentage: 15,
            active: true,
        })

        setSession(tenantId.toString(), 'manager')

        const res = await DELETE(
            new Request(`http://localhost/api/sectors/${sector._id.toString()}`, {
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: sector._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const dbSector = await Sector.findById(sector._id).lean()
        expect(dbSector?.active).toBe(false)
    })
})
