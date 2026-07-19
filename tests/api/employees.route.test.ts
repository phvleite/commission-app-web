import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/employees/route'
import { PATCH, DELETE } from '@/app/api/employees/[id]/route'

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

describe('API employees routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('POST cria colaborador para tenant autenticado', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })

        setSession(tenantId.toString(), 'admin')

        const res = await POST(
            new Request('http://localhost/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Joao Silva',
                    sectorId: sector._id.toString(),
                    admissionDate: '2024-01-15',
                }),
            }),
        )

        expect(res.status).toBe(201)
        const created = await Employee.findOne({ name: 'Joao Silva' }).lean()
        expect(created?.tenantId.toString()).toBe(tenantId.toString())
    })

    it('POST rejeita setor de outro tenant', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()
        await Sector.create({ tenantId: tenantA, name: 'A', percentage: 100 })
        const sectorB = await Sector.create({ tenantId: tenantB, name: 'B', percentage: 100 })

        setSession(tenantA.toString(), 'admin')

        const res = await POST(
            new Request('http://localhost/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Joao Silva',
                    sectorId: sectorB._id.toString(),
                    admissionDate: '2024-01-15',
                }),
            }),
        )

        expect(res.status).toBe(404)
    })

    it('GET lista somente colaboradores do tenant autenticado', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()
        const sectorA = await Sector.create({ tenantId: tenantA, name: 'A', percentage: 100 })
        const sectorB = await Sector.create({ tenantId: tenantB, name: 'B', percentage: 100 })

        await Employee.create({
            tenantId: tenantA,
            name: 'A User',
            sectorId: sectorA._id,
            admissionDate: new Date('2024-01-01'),
        })
        await Employee.create({
            tenantId: tenantB,
            name: 'B User',
            sectorId: sectorB._id,
            admissionDate: new Date('2024-01-01'),
        })

        setSession(tenantA.toString(), 'manager')

        const res = await GET(new Request('http://localhost/api/employees'))
        expect(res.status).toBe(200)

        const payload = (await res.json()) as { data: Array<{ name: string }> }
        expect(payload.data).toHaveLength(1)
        expect(payload.data[0].name).toBe('A User')
    })

    it('PATCH atualiza colaborador', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        const employee = await Employee.create({
            tenantId,
            name: 'Original',
            sectorId: sector._id,
            admissionDate: new Date('2024-01-01'),
        })

        setSession(tenantId.toString(), 'admin')

        const res = await PATCH(
            new Request(`http://localhost/api/employees/${employee._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Atualizado' }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const dbEmployee = await Employee.findById(employee._id).lean()
        expect(dbEmployee?.name).toBe('Atualizado')
    })

    it('PATCH com dismissalDate null remove data de demissao', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        const employee = await Employee.create({
            tenantId,
            name: 'Com Demissao',
            sectorId: sector._id,
            admissionDate: new Date('2024-01-01'),
            dismissalDate: new Date('2024-02-10'),
            active: false,
        })

        setSession(tenantId.toString(), 'admin')

        const res = await PATCH(
            new Request(`http://localhost/api/employees/${employee._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: true, dismissalDate: null }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const dbEmployee = await Employee.findById(employee._id).lean()
        expect(dbEmployee?.dismissalDate).toBeUndefined()
        expect(dbEmployee?.active).toBe(true)
    })

    it('DELETE inativa colaborador (soft delete)', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        const employee = await Employee.create({
            tenantId,
            name: 'Inativar',
            sectorId: sector._id,
            admissionDate: new Date('2024-01-01'),
            active: true,
        })

        setSession(tenantId.toString(), 'manager')

        const res = await DELETE(
            new Request(`http://localhost/api/employees/${employee._id.toString()}`, {
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const dbEmployee = await Employee.findById(employee._id).lean()
        expect(dbEmployee?.active).toBe(false)
    })
})
