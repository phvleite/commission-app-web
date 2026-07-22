import { auth } from '@/auth'
import { Sale } from '@/models/Sale'
import { SalesClientContainer } from './SalesClientContainer'

export default async function SalesPage() {
    const session = await auth()
    if (!session) return null

    // ===========================
    // CARREGAR VENDAS INICIAIS
    // ===========================
    const sales = await Sale.find({
        tenantId: session.user.tenantId,
    })
        .sort({ date: -1 })
        .lean()

    const initialSales = sales.map((sale) => ({
        _id: sale._id.toString(),
        date: sale.date.toISOString(),
        value: sale.value,
        totalCommissionValue: sale.totalCommissionValue,
    }))

    return <SalesClientContainer initialSales={initialSales} />
}
