import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sale } from '@/models/Sale'
import SalesClient from './SalesClient'
import {
    getRollingWindowYmd,
    getUtcRangeForCalendarDay,
    normalizeTimeZone,
} from '@/lib/date-timezone'

export default async function SalesPage() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }

    const timeZone = normalizeTimeZone(session.user.tenantTimeZone)
    const initialWindow = getRollingWindowYmd(45, timeZone)
    const startRange = getUtcRangeForCalendarDay(initialWindow.start, timeZone)
    const endRange = getUtcRangeForCalendarDay(initialWindow.end, timeZone)

    if (!startRange || !endRange) {
        throw new Error('Janela inicial de vendas invalida.')
    }

    const sales = await Sale.find({
        tenantId: session.user.tenantId,
        date: {
            $gte: startRange.start,
            $lte: endRange.end,
        },
    })
        .sort({ date: -1 })
        .lean()

    const initialSales = sales.map((sale) => ({
        _id: sale._id.toString(),
        date: sale.date.toISOString(),
        value: sale.value,
        totalCommissionValue: sale.totalCommissionValue,
    }))

    return (
        <SalesClient
            initialSales={initialSales}
            initialStartDate={initialWindow.start}
            initialEndDate={initialWindow.end}
        />
    )
}
