import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'
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
    const dayRange = getUtcRangeForCalendarDay(date, timeZone)

    if (!dayRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const sectors = await SaleCommissionSector.find({
        tenantId: session.user.tenantId,
        date: {
            $gte: dayRange.start,
            $lte: dayRange.end,
        },
    }).lean()

    const enriched = await Promise.all(
        sectors.map(async (s) => {
            const sector = await Sector.findById(s.sectorId).lean()
            return {
                ...s,
                sectorName: sector?.name ?? 'Setor',
            }
        }),
    )

    return NextResponse.json({ sectors: enriched })
}
