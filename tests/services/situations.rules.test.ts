import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { Situation } from '@/models/Situation'
import { SituationType } from '@/models/SituationType'
import { getSituationsForDate } from '@/services/situations/getSituationsForDate'
import { isEmployeeEligible } from '@/services/situations/isEmployeeEligible'
import { normalizeSituation } from '@/services/situations/normalizeSituation'

describe('situations services rules', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('normalizeSituation resolves populated references and dates', () => {
        const employeeId = new Types.ObjectId()
        const typeId = new Types.ObjectId()

        const normalized = normalizeSituation({
            _id: new Types.ObjectId(),
            employeeId: { _id: employeeId, name: 'Alice' },
            typeId: { _id: typeId, description: 'Ferias' },
            startDate: '2026-07-01T00:00:00.000Z',
            endDate: '2026-07-10T00:00:00.000Z',
            active: true,
        })

        expect(normalized.employeeId).toBe(employeeId.toString())
        expect(normalized.employeeName).toBe('Alice')
        expect(normalized.typeId).toBe(typeId.toString())
        expect(normalized.typeDescription).toBe('Ferias')
        expect(normalized.startDate).toBe('2026-07-01')
        expect(normalized.endDate).toBe('2026-07-10')
        expect(normalized.active).toBe(true)
    })

    it('getSituationsForDate returns only active situations in the target day', async () => {
        const tenantId = new Types.ObjectId().toString()
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

        const type = await SituationType.create({
            tenantId,
            description: 'Ferias',
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employee._id,
            typeId: type._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-10T00:00:00.000Z'),
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employee._id,
            typeId: type._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-10T00:00:00.000Z'),
            active: false,
        })

        const result = await getSituationsForDate(tenantId, employee._id.toString(), '2026-07-05')
        expect(result).toHaveLength(1)
        expect(result[0].employeeName).toBe('Alice')
        expect(result[0].typeDescription).toBe('Ferias')
    })

    it('isEmployeeEligible is false when there is active situation and true when there is none', async () => {
        const tenantId = new Types.ObjectId().toString()
        const sector = await Sector.create({
            tenantId,
            name: 'Setor A',
            percentage: 100,
            active: true,
            isMeritocracia: false,
        })

        const employeeWithSituation = await Employee.create({
            tenantId,
            name: 'Alice',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const employeeWithoutSituation = await Employee.create({
            tenantId,
            name: 'Bruno',
            sectorId: sector._id,
            admissionDate: new Date('2026-01-01T00:00:00.000Z'),
            active: true,
        })

        const type = await SituationType.create({
            tenantId,
            description: 'Ferias',
            active: true,
        })

        await Situation.create({
            tenantId,
            employeeId: employeeWithSituation._id,
            typeId: type._id,
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-10T00:00:00.000Z'),
            active: true,
        })

        const withSituation = await isEmployeeEligible(
            tenantId,
            employeeWithSituation._id.toString(),
            '2026-07-05',
        )
        const withoutSituation = await isEmployeeEligible(
            tenantId,
            employeeWithoutSituation._id.toString(),
            '2026-07-05',
        )

        expect(withSituation).toBe(false)
        expect(withoutSituation).toBe(true)
    })
})
