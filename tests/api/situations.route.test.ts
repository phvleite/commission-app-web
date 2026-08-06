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
import { GET, POST } from '@/app/api/situations/route'

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

describe('API situations route', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    async function seed(tenantId: string) {
        const sectorA = await Sector.create({
            tenantId,
            name: 'Setor A',
            percentage: 50,
            active: true,
            isMeritocracia: false,
        })

        const sectorB = await Sector.create({
            tenantId,
            name: 'Setor B',
            percentage: 50,
            active: true,
            isMeritocracia: false,
        })

        const employeeA = await Employee.create({
            tenantId,
            name: 'Alice',
            sectorId: sectorA._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const employeeB = await Employee.create({
            tenantId,
            name: 'Bruno',
            sectorId: sectorB._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const situationType = await SituationType.create({
            tenantId,
            description: 'Ferias',
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employeeA._id,
            typeId: situationType._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-31T00:00:00.000Z'),
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employeeB._id,
            typeId: situationType._id,
            startDate: new Date('2026-07-10T00:00:00.000Z'),
            endDate: new Date('2026-07-20T00:00:00.000Z'),
            active: true,
        })

        return { employeeA, employeeB, sectorA, sectorB, situationType }
    }

    it('GET filtra por setor corretamente', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { sectorA } = await seed(tenantId)

        const res = await GET(
            new Request(
                `http://localhost/api/situations?sectorId=${sectorA._id.toString()}&start=2026-07-01&end=2026-07-31`,
            ),
        )

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            situations: Array<{ employeeName: string }>
        }

        expect(payload.situations).toHaveLength(1)
        expect(payload.situations[0].employeeName).toBe('Alice')
    })

    it('GET por mes e ano retorna situacoes sobrepostas ao periodo', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        await seed(tenantId)

        const res = await GET(new Request('http://localhost/api/situations?month=7&year=2026'))

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            situations: Array<{ startDate: string; endDate: string }>
        }

        expect(payload.situations).toHaveLength(2)
        expect(payload.situations[0].startDate).toMatch(/^2026-07-\d{2}$/)
        expect(payload.situations[0].endDate).toMatch(/^2026-07-\d{2}$/)
    })

    it('GET retorna status ativo do colaborador junto das situacoes', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { employeeA } = await seed(tenantId)

        await Employee.updateOne({ _id: employeeA._id }, { $set: { active: false } })

        const res = await GET(
            new Request(
                `http://localhost/api/situations?employeeId=${employeeA._id.toString()}&start=2026-07-01&end=2026-07-31`,
            ),
        )

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            situations: Array<{ employeeName: string; employeeActive?: boolean }>
        }

        expect(payload.situations).toHaveLength(1)
        expect(payload.situations[0].employeeName).toBe('Alice')
        expect(payload.situations[0].employeeActive).toBe(false)
    })

    it('POST valida campos obrigatorios', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)

        const res = await POST(
            new Request('http://localhost/api/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '2026-07-01',
                    endDate: '2026-07-10',
                    employeeId: '',
                    typeId: '',
                }),
            }),
        )

        expect(res.status).toBe(400)
    })

    it('POST valida intervalo de datas', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { employeeA, situationType } = await seed(tenantId)

        const res = await POST(
            new Request('http://localhost/api/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '2026-07-20',
                    endDate: '2026-07-10',
                    employeeId: employeeA._id.toString(),
                    typeId: situationType._id.toString(),
                }),
            }),
        )

        expect(res.status).toBe(400)
    })

    it('POST cria situacao valida', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { employeeA, situationType } = await seed(tenantId)

        const res = await POST(
            new Request('http://localhost/api/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: '2026-08-01',
                    endDate: '2026-08-05',
                    employeeId: employeeA._id.toString(),
                    typeId: situationType._id.toString(),
                }),
            }),
        )

        expect(res.status).toBe(200)
        const payload = (await res.json()) as { _id: string }
        expect(payload._id).toBeTruthy()

        const created = await Situation.findById(payload._id).lean()
        expect(created).not.toBeNull()
    })

    it('GET sem filtros retorna todas as situacoes do tenant', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)

        const sector = await Sector.create({
            tenantId,
            name: 'Setor Janela',
            percentage: 100,
            active: true,
            isMeritocracia: false,
        })

        const employee = await Employee.create({
            tenantId,
            name: 'Funcionario Janela',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const situationType = await SituationType.create({
            tenantId,
            description: 'Afastamento',
            active: true,
        })

        const now = new Date()

        const recentStart = new Date(now)
        recentStart.setDate(now.getDate() - 5)
        recentStart.setUTCHours(0, 0, 0, 0)

        const recentEnd = new Date(now)
        recentEnd.setDate(now.getDate() + 2)
        recentEnd.setUTCHours(23, 59, 59, 999)

        const oldStart = new Date(now)
        oldStart.setDate(now.getDate() - 120)
        oldStart.setUTCHours(0, 0, 0, 0)

        const oldEnd = new Date(now)
        oldEnd.setDate(now.getDate() - 110)
        oldEnd.setUTCHours(23, 59, 59, 999)

        await Situation.create({
            tenantId,
            employeeId: employee._id,
            typeId: situationType._id,
            startDate: recentStart,
            endDate: recentEnd,
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employee._id,
            typeId: situationType._id,
            startDate: oldStart,
            endDate: oldEnd,
            active: true,
        })

        const res = await GET(new Request('http://localhost/api/situations'))

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            situations: Array<{ startDate: string; endDate: string }>
        }

        expect(payload.situations).toHaveLength(2)
    })

    it('GET com page retorna paginação de 50 itens com metadados', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)

        const sector = await Sector.create({
            tenantId,
            name: 'Setor Paginacao',
            percentage: 100,
            active: true,
            isMeritocracia: false,
        })

        const employee = await Employee.create({
            tenantId,
            name: 'Funcionario Paginacao',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const situationType = await SituationType.create({
            tenantId,
            description: 'Banco de Horas',
            active: true,
        })

        const baseDate = new Date('2026-01-01T00:00:00.000Z')
        await Promise.all(
            Array.from({ length: 55 }).map((_, index) => {
                const startDate = new Date(baseDate)
                startDate.setUTCDate(baseDate.getUTCDate() + index)
                const endDate = new Date(startDate)
                endDate.setUTCDate(startDate.getUTCDate() + 1)

                return Situation.create({
                    tenantId,
                    employeeId: employee._id,
                    typeId: situationType._id,
                    startDate,
                    endDate,
                    active: true,
                })
            }),
        )

        const res = await GET(new Request('http://localhost/api/situations?page=2&pageSize=50'))

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            situations: Array<{ _id: string }>
            currentPage: number
            totalPages: number
            totalItems: number
            pageSize: number
        }

        expect(payload.currentPage).toBe(2)
        expect(payload.totalPages).toBe(2)
        expect(payload.totalItems).toBe(55)
        expect(payload.pageSize).toBe(50)
        expect(payload.situations).toHaveLength(5)
    })
})
