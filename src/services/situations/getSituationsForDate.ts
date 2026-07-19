import { Situation } from '@/models/Situation'
import { connectDB } from '@/lib/db'
import { normalizeSituation } from './normalizeSituation'

export async function getSituationsForDate(tenantId: string, employeeId: string, date: string) {
    await connectDB()

    const target = new Date(date)

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
