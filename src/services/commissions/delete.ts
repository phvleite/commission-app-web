import { connectDB } from '@/lib/db'
import { Commission } from '@/models/Commission'
import { CommissionProcess } from '@/models/CommissionProcess'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sale } from '@/models/Sale'

export async function deleteCommissionsForDate(tenantId: string, date: Date): Promise<void> {
    await connectDB()

    // Desktop: só apaga comissões se existir venda no dia
    const saleExists = await Sale.exists({ tenantId, date })
    if (!saleExists) return

    await Promise.all([
        Commission.deleteMany({ tenantId, date }),
        SaleCommissionSector.deleteMany({ tenantId, date }),
    ])
}

export async function rollbackSaleAndCommissionsForDate(
    tenantId: string,
    date: Date,
): Promise<void> {
    await connectDB()

    await Promise.all([
        Commission.deleteMany({ tenantId, date }),
        SaleCommissionSector.deleteMany({ tenantId, date }),
        CommissionProcess.deleteOne({ tenantId, date }),
        Sale.deleteOne({ tenantId, date }),
    ])
}
