import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Commission } from '@/models/Commission'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
        return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    const commissions = await Commission.find({
        tenantId: session.user.tenantId,
        date: { $gte: startDate, $lte: endDate },
        situation: { $ne: 'Apto' },
    }).lean()

    const enriched = await Promise.all(
        commissions.map(async (c) => {
            const employee = await Employee.findById(c.employeeId).lean()
            const sector = await Sector.findById(c.sectorId).lean()

            return {
                date: c.date,
                employeeName: employee?.name ?? 'Colaborador',
                sectorName: sector?.name ?? 'Setor',
                totalCount: c.totalCount,
                eligibleCount: c.eligibleCount,
                situation: c.situation,
            }
        })
    )

    // Ordenação final
    enriched.sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime()
        if (a.employeeName !== b.employeeName) return a.employeeName.localeCompare(b.employeeName)
        return a.sectorName.localeCompare(b.sectorName)
    })

    return NextResponse.json({
        situations: enriched,
    })
}
