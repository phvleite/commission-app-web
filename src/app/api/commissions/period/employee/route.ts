import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Commission } from '@/models/Commission'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const id = searchParams.get('id')

    if (!start || !end || !id) {
        return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const startRange = getUtcRangeForCalendarDay(start, timeZone)
    const endRange = getUtcRangeForCalendarDay(end, timeZone)

    if (!startRange || !endRange) {
        return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const startDate = startRange.start
    const endDate = endRange.end

    const commissions = await Commission.find({
        tenantId: session.user.tenantId,
        employeeId: id,
        date: { $gte: startDate, $lte: endDate },
    }).lean()

    const enriched = await Promise.all(
        commissions.map(async (c) => {
            const employee = await Employee.findById(c.employeeId).lean()
            const sector = await Sector.findById(c.sectorId).lean()

            return {
                ...c,
                employeeName: employee?.name ?? 'Colaborador',
                sectorName: sector?.name ?? 'Setor',
            }
        }),
    )

    enriched.sort((a, b) => {
        const timeA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()
        const timeB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()

        if (timeA !== timeB) return timeA - timeB

        const sectorCompare = a.sectorName.localeCompare(b.sectorName, 'pt-BR')
        if (sectorCompare !== 0) return sectorCompare

        return a.situation.localeCompare(b.situation, 'pt-BR')
    })

    // Resumo por setor
    const sectorSummaryMap = new Map()
    enriched.forEach((c) => {
        const key = c.sectorName
        const current = sectorSummaryMap.get(key) || {
            sectorName: key,
            sectorValue: 0,
            employeeValue: 0,
        }

        current.sectorValue += c.sectorValue
        current.employeeValue += c.employeeValue

        sectorSummaryMap.set(key, current)
    })

    const sectorSummary = Array.from(sectorSummaryMap.values())

    return NextResponse.json({
        data: enriched,
        sectorSummary,
    })
}
