import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { CommissionProcess } from '@/models/CommissionProcess'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'
import { cancelMeritocracyAllocation } from '@/services/meritocracy/cancelMeritocracyAllocation'
import { generateMeritocracyAllocation } from '@/services/meritocracy/generateMeritocracyAllocation'

const TIME_ZONE = 'America/Sao_Paulo'

async function seedAllocation(tenantId: Types.ObjectId) {
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
        date: new Date('2027-06-01T03:00:00.000Z'),
        status: 'success',
        startedAt: new Date('2027-06-01T03:00:00.000Z'),
    })
    await SaleCommissionSector.create({
        tenantId,
        date: new Date('2027-06-01T03:00:00.000Z'),
        sectorId: meritSector._id,
        appliedPercentage: 10,
        totalSectorValue: 1000,
        totalEmployees: 0,
        eligibleEmployees: 0,
    })

    return generateMeritocracyAllocation({
        tenantId: tenantId.toString(),
        competence: '2027-06',
        timeZone: TIME_ZONE,
        selectedSectorIds: [sectorA._id.toString()],
        includedEmployeeIds: [],
        excludedEmployeeIds: [],
    })
}

describe('cancelMeritocracyAllocation', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('requires a cancellation reason', async () => {
        const tenantId = new Types.ObjectId()
        const allocation = await seedAllocation(tenantId)

        await expect(
            cancelMeritocracyAllocation({
                tenantId: tenantId.toString(),
                allocationId: allocation._id.toString(),
                reason: '   ',
            }),
        ).rejects.toMatchObject({ code: 'CANCEL_REASON_REQUIRED' })
    })

    it('cancels an existing allocation and keeps it queryable', async () => {
        const tenantId = new Types.ObjectId()
        const allocation = await seedAllocation(tenantId)

        const cancelled = await cancelMeritocracyAllocation({
            tenantId: tenantId.toString(),
            allocationId: allocation._id.toString(),
            reason: 'Valores incorretos',
        })

        expect(cancelled.status).toBe('cancelled')
        expect(cancelled.cancelReason).toBe('Valores incorretos')
        expect(cancelled.cancelledAt).toBeInstanceOf(Date)

        const stillExists = await MeritocracyAllocation.findById(allocation._id).lean()
        expect(stillExists?.status).toBe('cancelled')
    })

    it('rejects cancelling twice', async () => {
        const tenantId = new Types.ObjectId()
        const allocation = await seedAllocation(tenantId)

        await cancelMeritocracyAllocation({
            tenantId: tenantId.toString(),
            allocationId: allocation._id.toString(),
            reason: 'Primeiro cancelamento',
        })

        await expect(
            cancelMeritocracyAllocation({
                tenantId: tenantId.toString(),
                allocationId: allocation._id.toString(),
                reason: 'Segundo cancelamento',
            }),
        ).rejects.toMatchObject({ code: 'ALLOCATION_ALREADY_CANCELLED' })
    })

    it('rejects an allocation from another tenant', async () => {
        const tenantId = new Types.ObjectId()
        const otherTenantId = new Types.ObjectId()
        const allocation = await seedAllocation(tenantId)

        await expect(
            cancelMeritocracyAllocation({
                tenantId: otherTenantId.toString(),
                allocationId: allocation._id.toString(),
                reason: 'Tentativa indevida',
            }),
        ).rejects.toMatchObject({ code: 'ALLOCATION_NOT_FOUND' })
    })

    it('allows relaunching the same competence after cancellation', async () => {
        const tenantId = new Types.ObjectId()
        const allocation = await seedAllocation(tenantId)

        await cancelMeritocracyAllocation({
            tenantId: tenantId.toString(),
            allocationId: allocation._id.toString(),
            reason: 'Valores incorretos',
        })

        const relaunched = await generateMeritocracyAllocation({
            tenantId: tenantId.toString(),
            competence: '2027-06',
            timeZone: TIME_ZONE,
            selectedSectorIds: [allocation.selectedSectorIds[0].toString()],
            includedEmployeeIds: [],
            excludedEmployeeIds: [],
        })

        expect(relaunched.status).toBe('success')
        await expect(MeritocracyAllocation.countDocuments({ tenantId })).resolves.toBe(2)
    })
})
