import { Situation } from '@/models/Situation'
import { connectDB } from '@/lib/db'
import { normalizeSituation } from './normalizeSituation'
import { getUtcRangeForCalendarDay } from '@/lib/date-timezone'

export async function getSituationsForDate(
    tenantId: string,
    employeeId: string,
    date: string,
    timeZone = 'America/Sao_Paulo',
) {
    await connectDB()

    const dayRange = getUtcRangeForCalendarDay(date, timeZone)
    if (!dayRange) {
        return []
    }

    const target = dayRange.start

    const situations = await Situation.find({
        tenantId,
        employeeId,
        active: true,
        startDate: { $lte: target },
        endDate: { $gte: target },
    })
        .populate('employeeId', 'name')
        .populate('typeId', 'description')
        .lean()

    return situations.map(normalizeSituation)
}
