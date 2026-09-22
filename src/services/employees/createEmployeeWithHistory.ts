import { connectDB } from '@/lib/db'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { Sector } from '@/models/Sector'
import { Types } from 'mongoose'

interface CreateEmployeeWithHistoryInput {
    tenantId: string
    name: string
    sectorId: string
    admissionDate: Date
    dismissalDate?: Date
    createdBy?: string
}

export async function createEmployeeWithHistory(input: CreateEmployeeWithHistoryInput) {
    const db = await connectDB()
    const session = await db.startSession()

    try {
        let createdEmployee: InstanceType<typeof Employee> | null = null

        await session.withTransaction(async () => {
            const sector = await Sector.findOne({ _id: input.sectorId, tenantId: input.tenantId })
                .select('name')
                .session(session)
                .lean()

            const [employee] = await Employee.create(
                [
                    {
                        tenantId: input.tenantId,
                        name: input.name,
                        sectorId: input.sectorId,
                        admissionDate: input.admissionDate,
                        dismissalDate: input.dismissalDate,
                        active: !input.dismissalDate,
                    },
                ],
                { session },
            )

            await EmployeeSectorHistory.create(
                [
                    {
                        tenantId: input.tenantId,
                        employeeId: employee._id,
                        sectorId: input.sectorId,
                        sectorName: sector?.name,
                        startDate: input.admissionDate,
                        endDate: input.dismissalDate,
                        createdBy:
                            input.createdBy && Types.ObjectId.isValid(input.createdBy)
                                ? input.createdBy
                                : undefined,
                    },
                ],
                { session },
            )

            createdEmployee = employee
        })

        if (!createdEmployee) {
            throw new Error('Colaborador não foi criado.')
        }

        return createdEmployee
    } finally {
        await session.endSession()
    }
}
