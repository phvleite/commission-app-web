import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Commission } from '@/models/Commission'
import { Sale } from '@/models/Sale'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import {
    collectMissingIds,
    resolveMissingSnapshotNames,
} from '@/services/commissions/resolveSnapshotNames'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
        return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const startRange = getUtcRangeForCalendarDay(start, timeZone)
    const endRange = getUtcRangeForCalendarDay(end, timeZone)

    if (!startRange || !endRange) {
        return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
    }

    const startDate = startRange.start
    const endDate = endRange.end

    try {
        await connectDB()

        const commissions = await Commission.find({
            tenantId: session.user.tenantId,
            date: { $gte: startDate, $lte: endDate },
        }).lean()

        const sectorCommissions = await SaleCommissionSector.find({
            tenantId: session.user.tenantId,
            date: { $gte: startDate, $lte: endDate },
        }).lean()

        const { employeeNameById, sectorNameById } = await resolveMissingSnapshotNames({
            employeeIds: collectMissingIds(
                commissions,
                (item) => Boolean(item.employeeName),
                (item) => item.employeeId,
            ),
            sectorIds: [
                ...collectMissingIds(
                    commissions,
                    (item) => Boolean(item.sectorName),
                    (item) => item.sectorId,
                ),
                ...collectMissingIds(
                    sectorCommissions,
                    (item) => Boolean(item.sectorName),
                    (item) => item.sectorId,
                ),
            ],
        })

        const enriched = commissions.map((c) => ({
            ...c,
            employeeName:
                c.employeeName ?? employeeNameById.get(String(c.employeeId)) ?? 'Colaborador',
            sectorName: c.sectorName ?? sectorNameById.get(String(c.sectorId)) ?? 'Setor',
        }))

        const sectorSummaryMap = new Map<string, { sectorName: string; sectorValue: number }>()

        for (const entry of sectorCommissions) {
            const sectorName =
                entry.sectorName ?? sectorNameById.get(String(entry.sectorId)) ?? 'Setor'

            const current = sectorSummaryMap.get(sectorName) ?? {
                sectorName,
                sectorValue: 0,
            }

            current.sectorValue += entry.totalSectorValue
            sectorSummaryMap.set(sectorName, current)
        }

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

        const meritocracyAllocations = await MeritocracyAllocation.find({
            tenantId: session.user.tenantId,
            status: 'success',
            paymentDate: { $gte: startDate, $lte: endDate },
        })
            .select('totalMeritocracyValue')
            .lean()

        const meritocracyTotal = meritocracyAllocations.reduce(
            (total, allocation) => total + allocation.totalMeritocracyValue,
            0,
        )

        return NextResponse.json({
            data: enriched,
            sectorSummary,
            salesSummary,
            meritocracyTotal,
        })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return NextResponse.json(
            { error: 'Erro ao consultar comissões do período.' },
            { status: 500 },
        )
    }
}
