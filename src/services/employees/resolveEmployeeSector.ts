import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'

export async function resolveEmployeeSectorAtDate(
    tenantId: string,
    employeeId: string,
    referenceDate: Date,
) {
    return EmployeeSectorHistory.findOne({
        tenantId,
        employeeId,
        startDate: { $lte: referenceDate },
        $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: referenceDate } },
        ],
    })
        .sort({ startDate: -1 })
        .lean()
}

export async function resolveEmployeeSectorForPeriod(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
) {
    return EmployeeSectorHistory.findOne({
        tenantId,
        employeeId,
        startDate: { $lte: periodEnd },
        $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: periodStart } },
        ],
    })
        .sort({ startDate: -1 })
        .lean()
}
