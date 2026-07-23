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
    const id = searchParams.get('id')

    if (!start || !end || !id) {
        return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

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
        })
    )

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
