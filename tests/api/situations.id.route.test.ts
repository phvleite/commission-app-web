import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { Situation } from '@/models/Situation'
import { SituationType } from '@/models/SituationType'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { PATCH, PUT } from '@/app/api/situations/[id]/route'

const authMock = auth as unknown as jest.Mock

function setSession(tenantId: string) {
    authMock.mockResolvedValue({
        user: {
            id: new Types.ObjectId().toString(),
            tenantId,
            role: 'admin',
            email: 'admin@company.com',
            name: 'Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API situations by id route', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    async function seed(tenantId: string) {
        const sector = await Sector.create({
            tenantId,
            name: 'Setor A',
            percentage: 100,
            active: true,
            isMeritocracia: false,
        })

        const employee = await Employee.create({
            tenantId,
            name: 'Alice',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const typeA = await SituationType.create({
            tenantId,
            description: 'Ferias',
            active: true,
        })

        const typeB = await SituationType.create({
            tenantId,
            description: 'Folga',
            active: true,
        })

        const situation = await Situation.create({
            tenantId,
            employeeId: employee._id,
            typeId: typeA._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-10T00:00:00.000Z'),
            active: true,
        })

        return { employee, typeB, situation }
    }

    it('PUT valida campos obrigatorios', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { situation } = await seed(tenantId)

        const res = await PUT(
            new Request(`http://localhost/api/situations/${situation._id.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '',
                    endDate: '',
                    employeeId: '',
                    typeId: '',
                }),
            }),
            { params: Promise.resolve({ id: situation._id.toString() }) },
        )

        expect(res.status).toBe(400)
    })

    it('PUT valida intervalo de datas', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { situation, employee, typeB } = await seed(tenantId)

        const res = await PUT(
            new Request(`http://localhost/api/situations/${situation._id.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '2026-07-20',
                    endDate: '2026-07-10',
                    employeeId: employee._id.toString(),
                    typeId: typeB._id.toString(),
                }),
            }),
            { params: Promise.resolve({ id: situation._id.toString() }) },
        )

        expect(res.status).toBe(400)
    })

    it('PUT atualiza uma situacao valida', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { situation, employee, typeB } = await seed(tenantId)

        const res = await PUT(
            new Request(`http://localhost/api/situations/${situation._id.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '2026-07-03',
                    endDate: '2026-07-09',
                    employeeId: employee._id.toString(),
                    typeId: typeB._id.toString(),
                }),
            }),
            { params: Promise.resolve({ id: situation._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const updated = await Situation.findById(situation._id).lean()
        expect(updated?.typeId.toString()).toBe(typeB._id.toString())
        expect(updated?.startDate.toISOString().substring(0, 10)).toBe('2026-07-03')
    })

    it('PATCH altera status ativo/inativo', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { situation } = await seed(tenantId)

        const res = await PATCH(
            new Request(`http://localhost/api/situations/${situation._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            }),
            { params: Promise.resolve({ id: situation._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const updated = await Situation.findById(situation._id).lean()
        expect(updated?.active).toBe(false)
    })
})
