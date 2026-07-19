import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date) {
        return NextResponse.json({ error: 'Data não informada.' }, { status: 400 })
    }

    const dateObj = new Date(date)

    const sectors = await SaleCommissionSector.find({
        tenantId: session.user.tenantId,
        date: dateObj,
    }).lean()

    const enriched = await Promise.all(
        sectors.map(async (s) => {
            const sector = await Sector.findById(s.sectorId).lean()
            return {
                ...s,
                sectorName: sector?.name ?? 'Setor',
            }
        })
    )

    return NextResponse.json({ sectors: enriched })
}
