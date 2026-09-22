import { connectDB } from '@/lib/db'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { Sector } from '@/models/Sector'
import { Types } from 'mongoose'

interface UpdateEmployeeWithHistoryInput {
    tenantId: string
    employeeId: string
    updatedBy?: string
    name?: string
    sectorId?: string
    sectorChangeDate?: Date
    admissionDate?: Date
    dismissalDate?: Date | null
}

function previousCalendarDay(date: Date): Date {
    const previous = new Date(date)
    previous.setUTCDate(previous.getUTCDate() - 1)
    return previous
}

export async function updateEmployeeWithHistory(input: UpdateEmployeeWithHistoryInput) {
    const db = await connectDB()
    const session = await db.startSession()

    try {
        let result: InstanceType<typeof Employee> | null = null

        await session.withTransaction(async () => {
            const employee = await Employee.findOne({
                _id: input.employeeId,
                tenantId: input.tenantId,
            }).session(session)

            if (!employee) {
                throw new Error('EMPLOYEE_NOT_FOUND')
            }

            let histories = await EmployeeSectorHistory.find({
                tenantId: input.tenantId,
                employeeId: employee._id,
            })
                .sort({ startDate: 1 })
                .session(session)

            if (histories.length === 0) {
                const currentSector = await Sector.findOne({
                    _id: employee.sectorId,
                    tenantId: input.tenantId,
                })
                    .select('name')
                    .session(session)
                    .lean()

                const [initialHistory] = await EmployeeSectorHistory.create(
                    [
                        {
                            tenantId: input.tenantId,
                            employeeId: employee._id,
                            sectorId: employee.sectorId,
                            sectorName: currentSector?.name,
                            startDate: employee.admissionDate,
                            endDate: employee.dismissalDate,
                            createdBy:
                                input.updatedBy && Types.ObjectId.isValid(input.updatedBy)
                                    ? input.updatedBy
                                    : undefined,
                        },
                    ],
                    { session },
                )
                histories = [initialHistory]
            }

            const admissionDate = input.admissionDate ?? employee.admissionDate
            const dismissalDate =
                input.dismissalDate === undefined
                    ? employee.dismissalDate
                    : (input.dismissalDate ?? undefined)

            if (dismissalDate && dismissalDate < admissionDate) {
                throw new Error('DISMISSAL_BEFORE_ADMISSION')
            }

            const firstHistory = histories[0]
            if (input.admissionDate) {
                if (firstHistory.endDate && input.admissionDate > firstHistory.endDate) {
                    throw new Error('ADMISSION_AFTER_FIRST_HISTORY')
                }
                firstHistory.startDate = input.admissionDate
                await firstHistory.save({ session })
            }

            const sectorChanged = Boolean(
                input.sectorId && String(employee.sectorId) !== input.sectorId,
            )

            if (sectorChanged) {
                if (!input.sectorChangeDate) {
                    throw new Error('SECTOR_CHANGE_DATE_REQUIRED')
                }

                const latestHistory = histories[histories.length - 1]
                if (input.sectorChangeDate <= latestHistory.startDate) {
                    throw new Error('SECTOR_CHANGE_DATE_INVALID')
                }
                if (input.sectorChangeDate < admissionDate) {
                    throw new Error('SECTOR_CHANGE_BEFORE_ADMISSION')
                }
                if (dismissalDate && input.sectorChangeDate > dismissalDate) {
                    throw new Error('SECTOR_CHANGE_AFTER_DISMISSAL')
                }

                latestHistory.endDate = previousCalendarDay(input.sectorChangeDate)
                await latestHistory.save({ session })

                const nextSector = await Sector.findOne({
                    _id: input.sectorId,
                    tenantId: input.tenantId,
                })
                    .select('name')
                    .session(session)
                    .lean()

                await EmployeeSectorHistory.create(
                    [
                        {
                            tenantId: input.tenantId,
                            employeeId: employee._id,
                            sectorId: input.sectorId,
                            sectorName: nextSector?.name,
                            startDate: input.sectorChangeDate,
                            endDate: dismissalDate,
                            createdBy:
                                input.updatedBy && Types.ObjectId.isValid(input.updatedBy)
                                    ? input.updatedBy
                                    : undefined,
                        },
                    ],
                    { session },
                )

                employee.sectorId = new Types.ObjectId(input.sectorId)
            } else if (input.dismissalDate !== undefined) {
                const latestHistory = histories[histories.length - 1]
                if (dismissalDate && dismissalDate < latestHistory.startDate) {
                    throw new Error('DISMISSAL_BEFORE_CURRENT_SECTOR')
                }
                latestHistory.endDate = dismissalDate
                await latestHistory.save({ session })
            }

            if (input.name !== undefined) employee.name = input.name
            employee.admissionDate = admissionDate
            employee.dismissalDate = dismissalDate
            employee.active = !dismissalDate

            await employee.save({ session })
            result = employee
        })

        if (!result) {
            throw new Error('Colaborador não foi atualizado.')
        }

        return result
    } finally {
        await session.endSession()
    }
}
