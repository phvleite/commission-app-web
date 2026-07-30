import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Commission } from '@/models/Commission'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { Sale } from '@/models/Sale'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/services/commissions/generate', () => ({
    generateCommissionsForDate: jest.fn(),
}))

import { auth } from '@/auth'
import { GET as getPeriod } from '@/app/api/commissions/period/route'
import { GET as getPeriodEmployee } from '@/app/api/commissions/period/employee/route'
import { GET as getSituations } from '@/app/api/commissions/situations/route'
import { GET as getSectors } from '@/app/api/commissions/sectors/route'
import { POST as postGenerate } from '@/app/api/commissions/generate/route'
import { generateCommissionsForDate } from '@/services/commissions/generate'

const authMock = auth as unknown as jest.Mock
const generateMock = generateCommissionsForDate as jest.MockedFunction<
    typeof generateCommissionsForDate
>

function setSession(tenantId: string | null) {
    if (!tenantId) {
        authMock.mockResolvedValue(null)
        return
    }

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

describe('API commissions routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        generateMock.mockReset()
        await clearTestDB()
    })

    async function seedCommissionData(tenantId: string) {
        const dateA = new Date('2026-07-01T00:00:00.000Z')
        const dateB = new Date('2026-07-02T00:00:00.000Z')

        const sectorA = await Sector.create({
            tenantId,
            name: 'Setor A',
            percentage: 70,
            active: true,
            isMeritocracia: false,
        })

        const sectorB = await Sector.create({
            tenantId,
            name: 'Setor B',
            percentage: 30,
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
            sectorId: sectorA._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        await Commission.create({
            tenantId,
            date: dateA,
            employeeId: employeeA._id,
            sectorId: sectorA._id,
            situation: 'Apto',
            sectorValue: 700,
            employeeValue: 350,
            eligibleCount: 2,
            totalCount: 2,
        })

        await Commission.create({
            tenantId,
            date: dateA,
            employeeId: employeeB._id,
            sectorId: sectorA._id,
            situation: 'Férias',
            sectorValue: 700,
            employeeValue: 0,
            eligibleCount: 1,
            totalCount: 2,
        })

        await Commission.create({
            tenantId,
            date: dateB,
            employeeId: employeeA._id,
            sectorId: sectorB._id,
            situation: 'Apto',
            sectorValue: 300,
            employeeValue: 300,
            eligibleCount: 1,
            totalCount: 1,
        })

        await SaleCommissionSector.create({
            tenantId,
            date: dateA,
            sectorId: sectorA._id,
            appliedPercentage: 70,
            totalSectorValue: 700,
            totalEmployees: 2,
            eligibleEmployees: 1,
        })

        await SaleCommissionSector.create({
            tenantId,
            date: dateB,
            sectorId: sectorB._id,
            appliedPercentage: 30,
            totalSectorValue: 300,
            totalEmployees: 1,
            eligibleEmployees: 1,
        })

        await Sale.create({
            tenantId,
            date: dateA,
            value: 10000,
            totalCommissionValue: 1000,
        })

        await Sale.create({
            tenantId,
            date: dateB,
            value: 12000,
            totalCommissionValue: 1200,
        })

        return { dateA, dateB, employeeA }
    }

    it('period route returns enriched data, sector summary and sales summary', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { dateA, dateB } = await seedCommissionData(tenantId)

        const res = await getPeriod(
            new Request(
                `http://localhost/api/commissions/period?start=${dateA.toISOString()}&end=${dateB.toISOString()}`,
            ),
        )

        expect(res.status).toBe(200)
        const json = await res.json()

        expect(json.data).toHaveLength(3)
        expect(json.sectorSummary).toEqual([
            { sectorName: 'Setor A', sectorValue: 700 },
            { sectorName: 'Setor B', sectorValue: 300 },
        ])
        expect(json.salesSummary).toEqual([
            { value: 10000, totalCommissionValue: 1000 },
            { value: 12000, totalCommissionValue: 1200 },
        ])
    })

    it('period employee route sorts by date and returns sector totals for the employee', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { dateA, dateB, employeeA } = await seedCommissionData(tenantId)

        const res = await getPeriodEmployee(
            new Request(
                `http://localhost/api/commissions/period/employee?start=${dateA.toISOString()}&end=${dateB.toISOString()}&id=${employeeA._id.toString()}`,
            ),
        )

        expect(res.status).toBe(200)
        const json = await res.json()

        expect(json.data).toHaveLength(2)
        expect(json.data[0].employeeName).toBe('Alice')
        expect(new Date(json.data[0].date).getTime()).toBe(dateA.getTime())
        expect(json.sectorSummary).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    sectorName: 'Setor A',
                    sectorValue: 700,
                    employeeValue: 350,
                }),
                expect.objectContaining({
                    sectorName: 'Setor B',
                    sectorValue: 300,
                    employeeValue: 300,
                }),
            ]),
        )
    })

    it('situations route returns only non-Apto situations ordered by date', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { dateA, dateB } = await seedCommissionData(tenantId)

        const res = await getSituations(
            new Request(
                `http://localhost/api/commissions/situations?start=${dateA.toISOString()}&end=${dateB.toISOString()}`,
            ),
        )

        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.situations).toHaveLength(1)
        expect(json.situations[0]).toMatchObject({
            employeeName: 'Bruno',
            sectorName: 'Setor A',
            situation: 'Férias',
        })
    })

    it('sectors route enriches snapshot with sector names for the requested day', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        const { dateA } = await seedCommissionData(tenantId)

        const res = await getSectors(
            new Request(`http://localhost/api/commissions/sectors?date=${dateA.toISOString()}`),
        )

        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.sectors).toHaveLength(1)
        expect(json.sectors[0]).toMatchObject({
            sectorName: 'Setor A',
            totalSectorValue: 700,
        })
    })

    it('generate route returns 401 without session and calls service when authenticated', async () => {
        setSession(null)
        const unauthorized = await postGenerate(
            new Request('http://localhost/api/commissions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: '2026-07-30T00:00:00.000Z' }),
            }),
        )
        expect(unauthorized.status).toBe(401)

        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId)
        generateMock.mockResolvedValue(undefined)

        const ok = await postGenerate(
            new Request('http://localhost/api/commissions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: '2026-07-30T00:00:00.000Z' }),
            }),
        )

        expect(ok.status).toBe(200)
        expect(generateMock).toHaveBeenCalledTimes(1)
        expect(generateMock).toHaveBeenCalledWith(tenantId, new Date('2026-07-30T00:00:00.000Z'))
    })
})
