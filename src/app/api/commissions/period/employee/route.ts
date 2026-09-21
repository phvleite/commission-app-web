import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Commission } from '@/models/Commission'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { MeritocracyAllocation, type IMeritocracyRecipient } from '@/models/MeritocracyAllocation'
import { connectDB } from '@/lib/db'
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

    await connectDB()

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

    const meritocracyAllocations = await MeritocracyAllocation.find({
        tenantId: session.user.tenantId,
        status: 'success',
        paymentDate: { $gte: startDate, $lte: endDate },
        'recipients.employeeId': id,
    })
        .select('recipients paymentDate')
        .lean()

    const meritocracyEntries = meritocracyAllocations.flatMap((allocation) =>
        allocation.recipients
            .filter((recipient: IMeritocracyRecipient) => String(recipient.employeeId) === id)
            .map((recipient: IMeritocracyRecipient) => ({
                date: allocation.paymentDate,
                situation: 'Meritocracia',
                sectorName: 'MERITOCRACIA',
                sectorValue: recipient.employeeValue,
                employeeValue: recipient.employeeValue,
            })),
    )

    const meritocracyValue = meritocracyAllocations.reduce(
        (total, allocation) =>
            total +
            allocation.recipients
                .filter((recipient: IMeritocracyRecipient) => String(recipient.employeeId) === id)
                .reduce(
                    (recipientTotal: number, recipient: IMeritocracyRecipient) =>
                        recipientTotal + recipient.employeeValue,
                    0,
                ),
        0,
    )

    return NextResponse.json({
        data: enriched,
        sectorSummary,
        meritocracyValue,
        meritocracyEntries,
    })
}
