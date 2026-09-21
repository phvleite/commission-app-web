import { Types } from 'mongoose'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

const tenantId = new Types.ObjectId()
const meritocracySectorId = new Types.ObjectId()
const sectorId = new Types.ObjectId()
const employeeAId = new Types.ObjectId()
const employeeBId = new Types.ObjectId()

function buildValidData(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        tenantId,
        competence: '2027-06',
        periodStart: new Date('2027-06-01T00:00:00.000Z'),
        periodEnd: new Date('2027-06-30T23:59:59.999Z'),
        paymentDate: new Date('2027-06-30T00:00:00.000Z'),
        meritocracySectorId,
        totalMeritocracyValue: 1000,
        recipientCount: 2,
        selectedSectorIds: [sectorId],
        explicitlyIncludedEmployeeIds: [],
        explicitlyExcludedEmployeeIds: [],
        recipients: [
            {
                employeeId: employeeAId,
                employeeName: 'Alice',
                sectorId,
                sectorName: 'Setor A',
                employeeValue: 500,
            },
            {
                employeeId: employeeBId,
                employeeName: 'Bruno',
                sectorId,
                sectorName: 'Setor A',
                employeeValue: 500,
            },
        ],
        ...overrides,
    }
}

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('MeritocracyAllocation model', () => {
    it('cria um lançamento válido', async () => {
        const doc = await MeritocracyAllocation.create(buildValidData())
        expect(doc._id).toBeDefined()
        expect(doc.status).toBe('success')
    })

    it('rejeita quando a soma dos destinatários difere do total', async () => {
        await expect(
            MeritocracyAllocation.create(buildValidData({ totalMeritocracyValue: 999 })),
        ).rejects.toThrow()
    })

    it('rejeita quando recipientCount não bate com a quantidade de destinatários', async () => {
        await expect(
            MeritocracyAllocation.create(buildValidData({ recipientCount: 5 })),
        ).rejects.toThrow()
    })

    it('rejeita lançamento sem destinatários', async () => {
        await expect(
            MeritocracyAllocation.create(
                buildValidData({ recipients: [], recipientCount: 0, totalMeritocracyValue: 0 }),
            ),
        ).rejects.toThrow()
    })

    it('bloqueia segundo lançamento "success" para a mesma competência', async () => {
        await MeritocracyAllocation.create(buildValidData())
        await expect(MeritocracyAllocation.create(buildValidData())).rejects.toThrow()
    })

    it('permite novo lançamento na mesma competência após cancelar o anterior', async () => {
        const first = await MeritocracyAllocation.create(buildValidData())
        first.status = 'cancelled'
        first.cancelReason = 'Valores incorretos'
        first.cancelledAt = new Date()
        await first.save()

        const second = await MeritocracyAllocation.create(buildValidData())
        expect(second._id).toBeDefined()
        expect(second.status).toBe('success')
    })

    it('permite competências diferentes para o mesmo tenant', async () => {
        await MeritocracyAllocation.create(buildValidData())
        const doc = await MeritocracyAllocation.create(
            buildValidData({
                competence: '2027-07',
                periodStart: new Date('2027-07-01T00:00:00.000Z'),
                periodEnd: new Date('2027-07-31T23:59:59.999Z'),
                paymentDate: new Date('2027-07-31T00:00:00.000Z'),
            }),
        )
        expect(doc._id).toBeDefined()
    })
})
