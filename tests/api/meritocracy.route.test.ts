import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { CommissionProcess } from '@/models/CommissionProcess'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/meritocracy/route'
import { GET as GET_ONE } from '@/app/api/meritocracy/[id]/route'
import { POST as POST_CANCEL } from '@/app/api/meritocracy/[id]/cancel/route'

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

async function seedMeritocracyData(tenantId: Types.ObjectId) {
    const meritSector = await Sector.create({
        tenantId,
        name: 'MERITOCRACIA',
        percentage: 10,
        active: true,
        isMeritocracia: true,
    })
    const sectorA = await Sector.create({
        tenantId,
        name: 'Setor A',
        percentage: 100,
        active: true,
    })
    const employee = await Employee.create({
        tenantId,
        name: 'Alice',
        sectorId: sectorA._id,
        admissionDate: new Date('2027-01-01T00:00:00.000Z'),
        active: true,
    })
    await EmployeeSectorHistory.create({
        tenantId,
        employeeId: employee._id,
        sectorId: sectorA._id,
        startDate: new Date('2027-01-01T00:00:00.000Z'),
    })
    await CommissionProcess.create({
        tenantId,
        date: new Date('2027-06-01T00:00:00.000Z'),
        status: 'success',
        startedAt: new Date('2027-06-01T00:00:00.000Z'),
    })
    await SaleCommissionSector.create({
        tenantId,
        date: new Date('2027-06-01T00:00:00.000Z'),
        sectorId: meritSector._id,
        appliedPercentage: 10,
        totalSectorValue: 1000,
        totalEmployees: 0,
        eligibleEmployees: 0,
    })

    return { meritSector, sectorA, employee }
}

describe('API meritocracy routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('POST retorna 401 sem autenticacao', async () => {
        authMock.mockResolvedValue(null)

        const res = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competence: '2027-06' }),
            }),
        )

        expect(res.status).toBe(401)
    })

    it('POST bloqueia seller para lancar meritocracia', async () => {
        const tenantId = new Types.ObjectId()
        setSession(tenantId.toString(), 'seller')

        const res = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competence: '2027-06' }),
            }),
        )

        expect(res.status).toBe(403)
    })

    it('POST exige competencia', async () => {
        const tenantId = new Types.ObjectId()
        setSession(tenantId.toString(), 'admin')

        const res = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
        )

        expect(res.status).toBe(400)
    })

    it('POST cria lancamento recalculando tudo no servidor', async () => {
        const tenantId = new Types.ObjectId()
        const { sectorA, employee } = await seedMeritocracyData(tenantId)
        setSession(tenantId.toString(), 'admin')

        const res = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence: '2027-06',
                    selectedSectorIds: [sectorA._id.toString()],
                }),
            }),
        )

        expect(res.status).toBe(201)
        const payload = (await res.json()) as {
            data: { totalMeritocracyValue: number; recipients: Array<{ employeeId: string }> }
        }
        expect(payload.data.totalMeritocracyValue).toBe(1000)
        expect(payload.data.recipients).toHaveLength(1)
        expect(payload.data.recipients[0].employeeId).toBe(employee._id.toString())
    })

    it('POST retorna 409 com errorCode quando ja existe lancamento para a competencia', async () => {
        const tenantId = new Types.ObjectId()
        const { sectorA } = await seedMeritocracyData(tenantId)
        setSession(tenantId.toString(), 'admin')

        const body = JSON.stringify({
            competence: '2027-06',
            selectedSectorIds: [sectorA._id.toString()],
        })

        await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            }),
        )

        const res = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            }),
        )

        expect(res.status).toBe(409)
        const payload = (await res.json()) as { errorCode?: string }
        expect(payload.errorCode).toBe('COMPETENCE_ALREADY_LAUNCHED')
    })

    it('GET lista apenas lancamentos do tenant autenticado', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()
        const { sectorA } = await seedMeritocracyData(tenantA)
        await seedMeritocracyData(tenantB)

        setSession(tenantA.toString(), 'admin')
        await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence: '2027-06',
                    selectedSectorIds: [sectorA._id.toString()],
                }),
            }),
        )

        setSession(tenantA.toString(), 'seller')
        const res = await GET(new Request('http://localhost/api/meritocracy'))
        expect(res.status).toBe(200)

        const payload = (await res.json()) as { data: Array<{ tenantId: string }> }
        expect(payload.data).toHaveLength(1)
        expect(payload.data[0].tenantId).toBe(tenantA.toString())
    })

    it('GET /[id] retorna 404 para lancamento de outro tenant', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()
        const { sectorA } = await seedMeritocracyData(tenantA)
        setSession(tenantA.toString(), 'admin')

        const created = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence: '2027-06',
                    selectedSectorIds: [sectorA._id.toString()],
                }),
            }),
        )
        const { data } = (await created.json()) as { data: { _id: string } }

        setSession(tenantB.toString(), 'seller')
        const res = await GET_ONE(new Request(`http://localhost/api/meritocracy/${data._id}`), {
            params: Promise.resolve({ id: data._id }),
        })

        expect(res.status).toBe(404)
    })

    it('POST /[id]/cancel exige motivo e cancela quando informado', async () => {
        const tenantId = new Types.ObjectId()
        const { sectorA } = await seedMeritocracyData(tenantId)
        setSession(tenantId.toString(), 'admin')

        const created = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence: '2027-06',
                    selectedSectorIds: [sectorA._id.toString()],
                }),
            }),
        )
        const { data } = (await created.json()) as { data: { _id: string } }

        const missingReason = await POST_CANCEL(
            new Request(`http://localhost/api/meritocracy/${data._id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ id: data._id }) },
        )
        expect(missingReason.status).toBe(400)

        const cancelled = await POST_CANCEL(
            new Request(`http://localhost/api/meritocracy/${data._id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Valores incorretos' }),
            }),
            { params: Promise.resolve({ id: data._id }) },
        )
        expect(cancelled.status).toBe(200)

        const stored = await MeritocracyAllocation.findById(data._id).lean()
        expect(stored?.status).toBe('cancelled')
    })

    it('POST /[id]/cancel bloqueia seller', async () => {
        const tenantId = new Types.ObjectId()
        const { sectorA } = await seedMeritocracyData(tenantId)
        setSession(tenantId.toString(), 'admin')

        const created = await POST(
            new Request('http://localhost/api/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence: '2027-06',
                    selectedSectorIds: [sectorA._id.toString()],
                }),
            }),
        )
        const { data } = (await created.json()) as { data: { _id: string } }

        setSession(tenantId.toString(), 'seller')
        const res = await POST_CANCEL(
            new Request(`http://localhost/api/meritocracy/${data._id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Teste' }),
            }),
            { params: Promise.resolve({ id: data._id }) },
        )

        expect(res.status).toBe(403)
    })
})
