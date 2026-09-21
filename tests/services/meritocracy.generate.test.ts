import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { CommissionProcess } from '@/models/CommissionProcess'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'
import {
    MeritocracyAllocationError,
    generateMeritocracyAllocation,
} from '@/services/meritocracy/generateMeritocracyAllocation'

const TIME_ZONE = 'America/Sao_Paulo'

async function seedSuccessfulDay(
    tenantId: Types.ObjectId,
    date: Date,
    sectorId: Types.ObjectId,
    value: number,
) {
    await CommissionProcess.create({
        tenantId,
        date,
        status: 'success',
        startedAt: date,
        finishedAt: date,
    })
    await SaleCommissionSector.create({
        tenantId,
        date,
        sectorId,
        appliedPercentage: 10,
        totalSectorValue: value,
        totalEmployees: 0,
        eligibleEmployees: 0,
    })
}

async function createEmployeeWithSingleHistory(
    tenantId: Types.ObjectId,
    name: string,
    sectorId: Types.ObjectId,
    admissionDate: Date,
    dismissalDate?: Date,
) {
    const employee = await Employee.create({
        tenantId,
        name,
        sectorId,
        admissionDate,
        dismissalDate,
        active: !dismissalDate,
    })
    await EmployeeSectorHistory.create({
        tenantId,
        employeeId: employee._id,
        sectorId,
        startDate: admissionDate,
        endDate: dismissalDate,
    })
    return employee
}

describe('generateMeritocracyAllocation', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('throws when there is no meritocracy sector configured', async () => {
        const tenantId = new Types.ObjectId()

        await expect(
            generateMeritocracyAllocation({
                tenantId: tenantId.toString(),
                competence: '2027-06',
                timeZone: TIME_ZONE,
                selectedSectorIds: [],
                includedEmployeeIds: [],
                excludedEmployeeIds: [],
            }),
        ).rejects.toMatchObject({ code: 'MERITOCRACY_SECTOR_NOT_FOUND' })
    })

    it('throws when there is no meritocracy value for the competence', async () => {
        const tenantId = new Types.ObjectId()
        await Sector.create({
            tenantId,
            name: 'MERITOCRACIA',
            percentage: 10,
            active: true,
            isMeritocracia: true,
        })

        await expect(
            generateMeritocracyAllocation({
                tenantId: tenantId.toString(),
                competence: '2027-06',
                timeZone: TIME_ZONE,
                selectedSectorIds: [],
                includedEmployeeIds: [],
                excludedEmployeeIds: [],
            }),
        ).rejects.toMatchObject({ code: 'NO_MERITOCRACY_VALUE' })
    })

    it('generates the allocation splitting the value among selected sectors and included employees', async () => {
        const tenantId = new Types.ObjectId()
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
            percentage: 50,
            active: true,
        })
        const sectorB = await Sector.create({
            tenantId,
            name: 'Setor B',
            percentage: 40,
            active: true,
        })

        const alice = await createEmployeeWithSingleHistory(
            tenantId,
            'Alice',
            sectorA._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )
        const bruno = await createEmployeeWithSingleHistory(
            tenantId,
            'Bruno',
            sectorA._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )
        const carla = await createEmployeeWithSingleHistory(
            tenantId,
            'Carla',
            sectorB._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )

        // failed day must not count toward the total
        await CommissionProcess.create({
            tenantId,
            date: new Date('2027-06-05T03:00:00.000Z'),
            status: 'failed',
            startedAt: new Date('2027-06-05T03:00:00.000Z'),
        })
        await SaleCommissionSector.create({
            tenantId,
            date: new Date('2027-06-05T03:00:00.000Z'),
            sectorId: meritSector._id,
            appliedPercentage: 10,
            totalSectorValue: 99999,
            totalEmployees: 0,
            eligibleEmployees: 0,
        })

        await seedSuccessfulDay(
            tenantId,
            new Date('2027-06-01T03:00:00.000Z'),
            meritSector._id,
            700,
        )
        await seedSuccessfulDay(
            tenantId,
            new Date('2027-06-02T03:00:00.000Z'),
            meritSector._id,
            301,
        )

        const allocation = await generateMeritocracyAllocation({
            tenantId: tenantId.toString(),
            competence: '2027-06',
            timeZone: TIME_ZONE,
            selectedSectorIds: [sectorA._id.toString()],
            includedEmployeeIds: [carla._id.toString()],
            excludedEmployeeIds: [],
        })

        expect(allocation.totalMeritocracyValue).toBe(1001)
        expect(allocation.recipientCount).toBe(3)
        expect(allocation.paymentDate.toISOString()).toBe('2027-06-30T03:00:00.000Z')

        const sum = allocation.recipients.reduce((total, r) => total + r.employeeValue, 0)
        expect(sum).toBe(1001)

        const recipientIds = allocation.recipients.map((r) => r.employeeId.toString()).sort()
        expect(recipientIds).toEqual(
            [alice._id.toString(), bruno._id.toString(), carla._id.toString()].sort(),
        )
    })

    it('excludes an employee even when their sector was selected', async () => {
        const tenantId = new Types.ObjectId()
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

        const alice = await createEmployeeWithSingleHistory(
            tenantId,
            'Alice',
            sectorA._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )
        const bruno = await createEmployeeWithSingleHistory(
            tenantId,
            'Bruno',
            sectorA._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )

        await seedSuccessfulDay(
            tenantId,
            new Date('2027-06-01T03:00:00.000Z'),
            meritSector._id,
            1000,
        )

        const allocation = await generateMeritocracyAllocation({
            tenantId: tenantId.toString(),
            competence: '2027-06',
            timeZone: TIME_ZONE,
            selectedSectorIds: [sectorA._id.toString()],
            includedEmployeeIds: [],
            excludedEmployeeIds: [bruno._id.toString()],
        })

        expect(allocation.recipientCount).toBe(1)
        expect(allocation.recipients[0].employeeId.toString()).toBe(alice._id.toString())
    })

    it('throws with the list of ineligible employees when selected employee was not active during the period', async () => {
        const tenantId = new Types.ObjectId()
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

        // admitted only after the competence period ends
        const daniel = await createEmployeeWithSingleHistory(
            tenantId,
            'Daniel',
            sectorA._id,
            new Date('2027-07-05T00:00:00.000Z'),
        )

        await seedSuccessfulDay(
            tenantId,
            new Date('2027-06-01T03:00:00.000Z'),
            meritSector._id,
            1000,
        )

        await expect(
            generateMeritocracyAllocation({
                tenantId: tenantId.toString(),
                competence: '2027-06',
                timeZone: TIME_ZONE,
                selectedSectorIds: [],
                includedEmployeeIds: [daniel._id.toString()],
                excludedEmployeeIds: [],
            }),
        ).rejects.toMatchObject({
            code: 'NO_ELIGIBLE_RECIPIENTS',
            details: [{ employeeId: daniel._id.toString(), employeeName: 'Daniel' }],
        })
    })

    it('blocks a second launch for the same competence', async () => {
        const tenantId = new Types.ObjectId()
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
        await createEmployeeWithSingleHistory(
            tenantId,
            'Alice',
            sectorA._id,
            new Date('2027-01-01T00:00:00.000Z'),
        )
        await seedSuccessfulDay(
            tenantId,
            new Date('2027-06-01T03:00:00.000Z'),
            meritSector._id,
            1000,
        )

        await generateMeritocracyAllocation({
            tenantId: tenantId.toString(),
            competence: '2027-06',
            timeZone: TIME_ZONE,
            selectedSectorIds: [sectorA._id.toString()],
            includedEmployeeIds: [],
            excludedEmployeeIds: [],
        })

        await expect(
            generateMeritocracyAllocation({
                tenantId: tenantId.toString(),
                competence: '2027-06',
                timeZone: TIME_ZONE,
                selectedSectorIds: [sectorA._id.toString()],
                includedEmployeeIds: [],
                excludedEmployeeIds: [],
            }),
        ).rejects.toMatchObject({ code: 'COMPETENCE_ALREADY_LAUNCHED' })

        await expect(MeritocracyAllocation.countDocuments({ tenantId })).resolves.toBe(1)
    })

    it('throws MeritocracyAllocationError instances with the right code', async () => {
        const tenantId = new Types.ObjectId()

        try {
            await generateMeritocracyAllocation({
                tenantId: tenantId.toString(),
                competence: 'invalid',
                timeZone: TIME_ZONE,
                selectedSectorIds: [],
                includedEmployeeIds: [],
                excludedEmployeeIds: [],
            })
            throw new Error('expected to throw')
        } catch (error) {
            expect(error).toBeInstanceOf(MeritocracyAllocationError)
            expect((error as MeritocracyAllocationError).code).toBe('INVALID_COMPETENCE')
        }
    })
})
