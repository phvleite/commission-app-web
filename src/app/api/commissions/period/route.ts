import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Commission } from '@/models/Commission'
import { Employee } from '@/models/Employee'
import { Sale } from '@/models/Sale'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
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

    await connectDB()

    const commissions = await Commission.find({
        tenantId: session.user.tenantId,
        date: { $gte: startDate, $lte: endDate },
    }).lean()

    // Enriquecer com nomes
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

    // Resumo por setor (inclui meritocracia via snapshot diário de setor)
    const sectorCommissions = await SaleCommissionSector.find({
        tenantId: session.user.tenantId,
        date: { $gte: startDate, $lte: endDate },
    }).lean()

    const sectorSummaryMap = new Map<string, { sectorName: string; sectorValue: number }>()

    await Promise.all(
        sectorCommissions.map(async (entry) => {
            const sector = await Sector.findById(entry.sectorId).select('name').lean()
            const sectorName = sector?.name ?? 'Setor'

            const current = sectorSummaryMap.get(sectorName) ?? {
                sectorName,
                sectorValue: 0,
            }

            current.sectorValue += entry.totalSectorValue
            sectorSummaryMap.set(sectorName, current)
        }),
    )

    const sectorSummary = Array.from(sectorSummaryMap.values()).sort((a, b) =>
        a.sectorName.localeCompare(b.sectorName, 'pt-BR'),
    )

    const sales = await Sale.find({
        tenantId: session.user.tenantId,
        date: { $gte: startDate, $lte: endDate },
    })
        .select('value totalCommissionValue')
        .lean()

    const salesSummary = sales.map((sale) => ({
        value: sale.value,
        totalCommissionValue: sale.totalCommissionValue,
    }))

    return NextResponse.json({
        data: enriched,
        sectorSummary,
        salesSummary,
    })
}
