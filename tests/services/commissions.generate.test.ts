import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { Sale } from '@/models/Sale'
import { Sector } from '@/models/Sector'
import { Employee } from '@/models/Employee'
import { SituationType } from '@/models/SituationType'
import { Situation } from '@/models/Situation'
import { Commission } from '@/models/Commission'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'

describe('generateCommissionsForDate', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('generates commissions with meritocracia and ineligible employee correctly', async () => {
        const tenantId = new Types.ObjectId().toString()
        const date = new Date('2026-07-10T00:00:00.000Z')

        const normalSector = await Sector.create({
            tenantId,
            name: 'Vendas',
            percentage: 50,
            active: true,
            isMeritocracia: false,
        })

        const meritSector = await Sector.create({
            tenantId,
            name: 'MERITOCRACIA',
            percentage: 50,
            active: true,
            isMeritocracia: true,
        })

        const employeeApto = await Employee.create({
            tenantId,
            name: 'Alice',
            sectorId: normalSector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const employeeFerias = await Employee.create({
            tenantId,
            name: 'Bruno',
            sectorId: normalSector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const tipoFerias = await SituationType.create({
            tenantId,
            description: 'Ferias',
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employeeFerias._id,
            typeId: tipoFerias._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-31T00:00:00.000Z'),
            active: true,
        })

        await Sale.create({
            tenantId,
            date,
            value: 100000,
            totalCommissionValue: 100,
        })

        await generateCommissionsForDate(tenantId, date)

        const sectorSnapshots = await SaleCommissionSector.find({ tenantId, date }).lean()
        expect(sectorSnapshots).toHaveLength(2)

        const normalSnapshot = sectorSnapshots.find(
            (entry) => String(entry.sectorId) === String(normalSector._id),
        )
        const meritSnapshot = sectorSnapshots.find(
            (entry) => String(entry.sectorId) === String(meritSector._id),
        )

        expect(normalSnapshot).toMatchObject({
            totalSectorValue: 50,
            totalEmployees: 2,
            eligibleEmployees: 1,
        })

        expect(meritSnapshot).toMatchObject({
            totalSectorValue: 50,
            totalEmployees: 0,
            eligibleEmployees: 0,
        })

        const commissions = await Commission.find({ tenantId, date }).lean()
        expect(commissions).toHaveLength(2)

        const aptoCommission = commissions.find(
            (item) => String(item.employeeId) === String(employeeApto._id),
        )
        const feriasCommission = commissions.find(
            (item) => String(item.employeeId) === String(employeeFerias._id),
        )

        expect(aptoCommission).toMatchObject({
            situation: 'Apto',
            employeeValue: 50,
            eligibleCount: 1,
            totalCount: 2,
            sectorValue: 50,
        })

        expect(feriasCommission).toMatchObject({
            situation: 'Ferias',
            employeeValue: 0,
            eligibleCount: 1,
            totalCount: 2,
            sectorValue: 50,
        })
    })

    it('regenerates snapshots without duplicating records for the same day', async () => {
        const tenantId = new Types.ObjectId().toString()
        const date = new Date('2026-07-11T00:00:00.000Z')

        const sector = await Sector.create({
            tenantId,
            name: 'Vendas',
            percentage: 100,
            active: true,
            isMeritocracia: false,
        })

        await Employee.create({
            tenantId,
            name: 'Carla',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const sale = await Sale.create({
            tenantId,
            date,
            value: 50000,
            totalCommissionValue: 100,
        })

        await generateCommissionsForDate(tenantId, date)

        sale.totalCommissionValue = 120
        await sale.save()

        await generateCommissionsForDate(tenantId, date)

        const commissions = await Commission.find({ tenantId, date }).lean()
        const sectorSnapshots = await SaleCommissionSector.find({ tenantId, date }).lean()

        expect(commissions).toHaveLength(1)
        expect(sectorSnapshots).toHaveLength(1)
        expect(commissions[0]?.employeeValue).toBe(120)
        expect(sectorSnapshots[0]?.totalSectorValue).toBe(120)
    })
})
