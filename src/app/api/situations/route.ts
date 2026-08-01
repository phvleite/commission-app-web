import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Situation } from '@/models/Situation'
import { Employee } from '@/models/Employee'
import {
    getRollingWindowYmd,
    formatDateToYmdInTimeZone,
    getUtcRangeForCalendarDay,
    getUtcRangeForCalendarMonth,
    resolveRequestTimeZone,
} from '@/lib/date-timezone'

export async function GET(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const employeeId = searchParams.get('employeeId')
    const typeId = searchParams.get('typeId')
    const sectorId = searchParams.get('sectorId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)

    await connectDB()

    const query: Record<string, unknown> = { tenantId }

    if (employeeId && employeeId !== 'todos') query.employeeId = employeeId
    if (typeId && typeId !== 'todos') query.typeId = typeId

    // Se sectorId foi fornecido, buscar employees do setor
    if (sectorId && sectorId !== 'todos') {
        const employeesInSector = await Employee.find({ tenantId, sectorId }, '_id').lean()
        const employeeIds = employeesInSector.map((e) => e._id)
        query.employeeId = { $in: employeeIds }
    }

    if (start && end) {
        const startRange = getUtcRangeForCalendarDay(start, timeZone)
        const endRange = getUtcRangeForCalendarDay(end, timeZone)

        if (!startRange || !endRange) {
            return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
        }

        query.$and = [
            { startDate: { $lte: endRange.end } },
            { endDate: { $gte: startRange.start } },
        ]
    } else if (month || year) {
        const y = year ? parseInt(year) : new Date().getFullYear()
        const m = month ? parseInt(month) : undefined

        if (Number.isNaN(y) || (m !== undefined && Number.isNaN(m))) {
            return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
        }

        const firstDay =
            m !== undefined
                ? getUtcRangeForCalendarMonth(y, m, timeZone).start
                : getUtcRangeForCalendarMonth(y, 1, timeZone).start

        const lastDay =
            m !== undefined
                ? getUtcRangeForCalendarMonth(y, m, timeZone).end
                : getUtcRangeForCalendarMonth(y, 12, timeZone).end

        query.$and = [{ startDate: { $lte: lastDay } }, { endDate: { $gte: firstDay } }]
    } else {
        const initialWindow = getRollingWindowYmd(45, timeZone)
        const startRange = getUtcRangeForCalendarDay(initialWindow.start, timeZone)
        const endRange = getUtcRangeForCalendarDay(initialWindow.end, timeZone)

        if (!startRange || !endRange) {
            return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
        }

        query.$and = [
            { startDate: { $lte: endRange.end } },
            { endDate: { $gte: startRange.start } },
        ]
    }

    const situations = await Situation.find(query)
        .populate('employeeId', 'name active')
        .populate('typeId', 'description')
        .sort({ startDate: -1 })
        .lean()

    return NextResponse.json({
        situations: situations.map((s) => ({
            _id: String(s._id),
            employeeId: String((s.employeeId as Record<string, unknown>)?._id ?? ''),
            employeeName: (s.employeeId as Record<string, unknown>)?.name ?? '',
            employeeActive:
                (s.employeeId as Record<string, unknown>)?.active === true ||
                (s.employeeId as Record<string, unknown>)?.active === false
                    ? ((s.employeeId as Record<string, unknown>).active as boolean)
                    : true,
            typeId: String((s.typeId as Record<string, unknown>)?._id ?? ''),
            typeDescription: (s.typeId as Record<string, unknown>)?.description ?? '',
            startDate: formatDateToYmdInTimeZone(s.startDate, timeZone),
            endDate: formatDateToYmdInTimeZone(s.endDate, timeZone),
            active: s.active,
        })),
    })
}

export async function POST(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { startDate, endDate, employeeId, typeId } = await req.json()

    if (!startDate || !endDate || !employeeId || !typeId) {
        return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const startRange = getUtcRangeForCalendarDay(startDate, timeZone)
    const endRange = getUtcRangeForCalendarDay(endDate, timeZone)

    if (!startRange || !endRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    if (endRange.start < startRange.start) {
        return NextResponse.json(
            { error: 'A data final não pode ser menor que a inicial.' },
            { status: 400 },
        )
    }

    await connectDB()

    const created = await Situation.create({
        tenantId,
        startDate: startRange.start,
        endDate: endRange.end,
        employeeId,
        typeId,
        active: true,
    })

    return NextResponse.json({ _id: String(created._id) })
}
