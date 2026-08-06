import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sale } from '@/models/Sale'
import SalesClient from './SalesClient'
import { normalizeTimeZone } from '@/lib/date-timezone'

export default async function SalesPage() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }

    normalizeTimeZone(session.user.tenantTimeZone)

    const pageSize = 50
    const totalItems = await Sale.countDocuments({ tenantId: session.user.tenantId })
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    const sales = await Sale.find({
        tenantId: session.user.tenantId,
    })
        .sort({ date: -1 })
        .limit(pageSize)
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
            initialStartDate=""
            initialEndDate=""
            initialCurrentPage={1}
            initialTotalPages={totalPages}
            initialTotalItems={totalItems}
            initialPageSize={pageSize}
        />
    )
}
