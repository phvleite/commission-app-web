import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { resolveEmployeeSectorForPeriod } from '@/services/employees/resolveEmployeeSector'

describe('EmployeeSectorHistory', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('rejects an end date before the start date', async () => {
        await expect(
            EmployeeSectorHistory.create({
                tenantId: new Types.ObjectId(),
                employeeId: new Types.ObjectId(),
                sectorId: new Types.ObjectId(),
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-01-31'),
            }),
        ).rejects.toThrow('A data final não pode ser anterior')
    })

    it('resolves the last sector occupied during a competence', async () => {
        const tenantId = new Types.ObjectId()
        const employeeId = new Types.ObjectId()
        const firstSectorId = new Types.ObjectId()
        const secondSectorId = new Types.ObjectId()
        await EmployeeSectorHistory.create([
            {
                tenantId,
                employeeId,
                sectorId: firstSectorId,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-06-14'),
            },
            {
                tenantId,
                employeeId,
                sectorId: secondSectorId,
                startDate: new Date('2026-06-15'),
            },
        ])

        const resolved = await resolveEmployeeSectorForPeriod(
            tenantId.toString(),
            employeeId.toString(),
            new Date('2026-06-01'),
            new Date('2026-06-30'),
        )

        expect(String(resolved?.sectorId)).toBe(secondSectorId.toString())
    })
})
