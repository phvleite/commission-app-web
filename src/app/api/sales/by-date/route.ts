import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Sale } from '@/models/Sale'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date) {
        return NextResponse.json({ error: 'Data não informada.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const range = getUtcRangeForCalendarDay(date, timeZone)

    if (!range) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const exists = await Sale.findOne({
        tenantId: session.user.tenantId,
        date: {
            $gte: range.start,
            $lte: range.end,
        },
    }).lean()

    return NextResponse.json({ exists: !!exists })
}
