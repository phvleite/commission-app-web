import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date } = await req.json()

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const dayRange = getUtcRangeForCalendarDay(date, timeZone)

    if (!dayRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    await generateCommissionsForDate(session.user.tenantId, dayRange.start)

    return NextResponse.json({ ok: true })
}
