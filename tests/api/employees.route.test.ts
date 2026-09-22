import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { Sector } from '@/models/Sector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/employees/route'
import { PATCH, DELETE } from '@/app/api/employees/[id]/route'
import {
    GET as GET_SECTOR_HISTORY,
    PATCH as PATCH_SECTOR_HISTORY,
} from '@/app/api/employees/[id]/sector-history/route'

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
        const history = await EmployeeSectorHistory.findOne({ employeeId: created?._id }).lean()
        expect(history).toMatchObject({
            sectorId: sector._id,
            sectorName: 'Vendas',
            startDate: new Date('2024-01-15'),
        })
    })

    it('POST retorna erro de banco quando a conexão cai ao criar colaborador', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })

        setSession(tenantId.toString(), 'admin')

        const createSpy = jest.spyOn(Employee, 'create').mockRejectedValueOnce(
            Object.assign(new Error('MongoDB connection lost'), {
                name: 'MongoNetworkError',
                code: 'ECONNRESET',
            }),
        )

        const res = await POST(
            new Request('http://localhost/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Sem Banco',
                    sectorId: sector._id.toString(),
                    admissionDate: '2024-01-15',
                }),
            }),
        )

        expect(res.status).toBe(503)
        await expect(res.json()).resolves.toMatchObject({
            errorCode: 'database_connection_lost',
        })

        createSpy.mockRestore()
    })

    it('POST reverte o colaborador quando o histórico não pode ser criado', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        setSession(tenantId.toString(), 'admin')
        const historySpy = jest
            .spyOn(EmployeeSectorHistory, 'create')
            .mockRejectedValueOnce(new Error('history failure'))

        const response = await POST(
            new Request('http://localhost/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Sem Historico',
                    sectorId: sector._id.toString(),
                    admissionDate: '2024-01-15',
                }),
            }),
        )

        expect(response.status).toBe(500)
        await expect(Employee.countDocuments({ tenantId })).resolves.toBe(0)
        historySpy.mockRestore()
    })

    it('POST cria colaborador e alerta quando ultrapassa a faixa do plano', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        await Employee.insertMany(
            Array.from({ length: 20 }, (_, index) => ({
                tenantId,
                name: `Colaborador ${index + 1}`,
                sectorId: sector._id,
                admissionDate: new Date('2024-01-01'),
                active: true,
            })),
        )

        setSession(tenantId.toString(), 'admin')

        const res = await POST(
            new Request('http://localhost/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Colaborador 21',
                    sectorId: sector._id.toString(),
                    admissionDate: '2024-01-15',
                }),
            }),
        )

        expect(res.status).toBe(201)
        const payload = (await res.json()) as { warning?: string }
        expect(payload.warning).toContain('ultrapassou a faixa de até 20 colaboradores')
        await expect(Employee.countDocuments({ tenantId })).resolves.toBe(21)
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

    it('PATCH exige data quando altera o setor', async () => {
        const tenantId = new Types.ObjectId()
        const sectorA = await Sector.create({ tenantId, name: 'A', percentage: 50 })
        const sectorB = await Sector.create({ tenantId, name: 'B', percentage: 50 })
        const employee = await Employee.create({
            tenantId,
            name: 'Trocar Setor',
            sectorId: sectorA._id,
            admissionDate: new Date('2024-01-01'),
        })
        setSession(tenantId.toString(), 'admin')

        const res = await PATCH(
            new Request(`http://localhost/api/employees/${employee._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectorId: sectorB._id.toString() }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({
            error: 'Informe a data da mudança de setor.',
        })
    })

    it('PATCH registra a troca de setor sem sobrepor períodos', async () => {
        const tenantId = new Types.ObjectId()
        const sectorA = await Sector.create({ tenantId, name: 'A', percentage: 50 })
        const sectorB = await Sector.create({ tenantId, name: 'B', percentage: 50 })
        const employee = await Employee.create({
            tenantId,
            name: 'Trocar Setor',
            sectorId: sectorA._id,
            admissionDate: new Date('2024-01-01'),
        })
        await EmployeeSectorHistory.create({
            tenantId,
            employeeId: employee._id,
            sectorId: sectorA._id,
            startDate: new Date('2024-01-01'),
        })
        setSession(tenantId.toString(), 'admin')

        const res = await PATCH(
            new Request(`http://localhost/api/employees/${employee._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectorId: sectorB._id.toString(),
                    sectorChangeDate: '2024-03-01',
                }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const histories = await EmployeeSectorHistory.find({ employeeId: employee._id })
            .sort({ startDate: 1 })
            .lean()
        expect(histories).toHaveLength(2)
        expect(histories[0]).toMatchObject({
            sectorId: sectorA._id,
            endDate: new Date('2024-02-29'),
        })
        expect(histories[1]).toMatchObject({
            sectorId: sectorB._id,
            startDate: new Date('2024-03-01'),
        })
        expect(histories[1]?.endDate).toBeUndefined()
    })

    it('GET sector-history retorna somente o histórico do tenant autenticado', async () => {
        const tenantId = new Types.ObjectId()
        const otherTenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'A', percentage: 100 })
        const otherSector = await Sector.create({
            tenantId: otherTenantId,
            name: 'B',
            percentage: 100,
        })
        const employee = await Employee.create({
            tenantId,
            name: 'Historico',
            sectorId: sector._id,
            admissionDate: new Date('2024-01-01'),
        })
        await EmployeeSectorHistory.create({
            tenantId,
            employeeId: employee._id,
            sectorId: sector._id,
            startDate: new Date('2024-01-01'),
        })
        const otherEmployee = await Employee.create({
            tenantId: otherTenantId,
            name: 'Outro',
            sectorId: otherSector._id,
            admissionDate: new Date('2024-01-01'),
        })
        setSession(tenantId.toString(), 'seller')

        const success = await GET_SECTOR_HISTORY(
            new Request(`http://localhost/api/employees/${employee._id}/sector-history`),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )
        expect(success.status).toBe(200)
        await expect(success.json()).resolves.toMatchObject({
            data: [{ sectorName: 'A' }],
        })

        const forbiddenTenant = await GET_SECTOR_HISTORY(
            new Request(`http://localhost/api/employees/${otherEmployee._id}/sector-history`),
            { params: Promise.resolve({ id: otherEmployee._id.toString() }) },
        )
        expect(forbiddenTenant.status).toBe(404)
    })

    it('PATCH sector-history permite ao admin corrigir o setor atual', async () => {
        const tenantId = new Types.ObjectId()
        const sectorA = await Sector.create({ tenantId, name: 'A', percentage: 50 })
        const sectorB = await Sector.create({ tenantId, name: 'B', percentage: 50 })
        const employee = await Employee.create({
            tenantId,
            name: 'Corrigir',
            sectorId: sectorA._id,
            admissionDate: new Date('2024-01-01'),
        })
        const history = await EmployeeSectorHistory.create({
            tenantId,
            employeeId: employee._id,
            sectorId: sectorA._id,
            startDate: new Date('2024-01-01'),
        })
        setSession(tenantId.toString(), 'admin')

        const response = await PATCH_SECTOR_HISTORY(
            new Request(`http://localhost/api/employees/${employee._id}/sector-history`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    historyId: history._id.toString(),
                    sectorId: sectorB._id.toString(),
                    startDate: '2024-01-01',
                    endDate: null,
                }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(response.status).toBe(200)
        const updatedEmployee = await Employee.findById(employee._id).lean()
        const updatedHistory = await EmployeeSectorHistory.findById(history._id).lean()
        expect(String(updatedEmployee?.sectorId)).toBe(sectorB._id.toString())
        expect(String(updatedHistory?.sectorId)).toBe(sectorB._id.toString())
    })

    it('PATCH sector-history bloqueia perfil que não é admin', async () => {
        const tenantId = new Types.ObjectId()
        setSession(tenantId.toString(), 'manager')

        const response = await PATCH_SECTOR_HISTORY(
            new Request('http://localhost/api/employees/507f1f77bcf86cd799439011/sector-history', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) },
        )

        expect(response.status).toBe(403)
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

    it('PATCH alerta ao reativar colaborador acima da faixa do plano', async () => {
        const tenantId = new Types.ObjectId()
        const sector = await Sector.create({ tenantId, name: 'Vendas', percentage: 100 })
        await Employee.insertMany(
            Array.from({ length: 20 }, (_, index) => ({
                tenantId,
                name: `Ativo ${index + 1}`,
                sectorId: sector._id,
                admissionDate: new Date('2024-01-01'),
                active: true,
            })),
        )
        const employee = await Employee.create({
            tenantId,
            name: 'Reativar',
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
                body: JSON.stringify({ dismissalDate: null }),
            }),
            { params: Promise.resolve({ id: employee._id.toString() }) },
        )

        expect(res.status).toBe(200)
        const payload = (await res.json()) as { warning?: string }
        expect(payload.warning).toContain('ultrapassou a faixa de até 20 colaboradores')
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
