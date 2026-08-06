import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Situation } from '@/models/Situation'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

interface Params {
    params: Promise<{ id: string }>
}

export async function PUT(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

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

    const updated = await Situation.findOneAndUpdate(
        { _id: id, tenantId },
        {
            startDate: startRange.start,
            endDate: endRange.end,
            employeeId,
            typeId,
        },
        { returnDocument: 'after' },
    )

    return NextResponse.json(updated)
}

export async function PATCH(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const { active } = await req.json()

    await connectDB()

    const updated = await Situation.findOneAndUpdate(
        { _id: id, tenantId },
        { active: Boolean(active) },
        { returnDocument: 'after' },
    )

    return NextResponse.json(updated)
}
