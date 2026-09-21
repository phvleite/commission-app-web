import { connectDB } from '@/lib/db'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { Types } from 'mongoose'

interface CorrectionInput {
    tenantId: string
    employeeId: string
    historyId: string
    sectorId: string
    startDate: Date
    endDate?: Date | null
}

function addUtcDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
}

export async function correctEmployeeSectorHistory(input: CorrectionInput) {
    const db = await connectDB()
    const session = await db.startSession()

    try {
        let correctedId: Types.ObjectId | null = null

        await session.withTransaction(async () => {
            const employee = await Employee.findOne({
                _id: input.employeeId,
                tenantId: input.tenantId,
            }).session(session)
            if (!employee) throw new Error('EMPLOYEE_NOT_FOUND')

            const histories = await EmployeeSectorHistory.find({
                tenantId: input.tenantId,
                employeeId: input.employeeId,
            })
                .sort({ startDate: 1 })
                .session(session)
            const index = histories.findIndex((history) => String(history._id) === input.historyId)
            if (index < 0) throw new Error('HISTORY_NOT_FOUND')

            const target = histories[index]
            const previous = histories[index - 1]
            const next = histories[index + 1]

            if (index === 0 && input.startDate.getTime() !== employee.admissionDate.getTime()) {
                throw new Error('FIRST_HISTORY_MUST_START_AT_ADMISSION')
            }
            if (previous && input.startDate <= previous.startDate) {
                throw new Error('HISTORY_START_INVALID')
            }

            let endDate = input.endDate ?? undefined
            if (next) {
                if (!endDate) endDate = addUtcDays(next.startDate, -1)
                if (endDate < input.startDate) throw new Error('HISTORY_END_INVALID')
                next.startDate = addUtcDays(endDate, 1)
                await next.save({ session })
            } else if (employee.dismissalDate) {
                endDate = employee.dismissalDate
            } else {
                endDate = undefined
            }

            if (previous) {
                previous.endDate = addUtcDays(input.startDate, -1)
                if (previous.endDate < previous.startDate) {
                    throw new Error('HISTORY_START_INVALID')
                }
                await previous.save({ session })
            }

            target.sectorId = new Types.ObjectId(input.sectorId)
            target.startDate = input.startDate
            target.endDate = endDate
            await target.save({ session })

            if (!next) {
                employee.sectorId = new Types.ObjectId(input.sectorId)
                await employee.save({ session })
            }

            correctedId = target._id
        })

        if (!correctedId) throw new Error('Histórico não foi corrigido.')
        return correctedId
    } finally {
        await session.endSession()
    }
}
