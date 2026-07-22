import { connectDB } from '@/lib/db'
import { Commission } from '@/models/Commission'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'

export async function deleteCommissionsForDate(tenantId: string, date: Date): Promise<void> {
    await connectDB()

    await Promise.all([
        Commission.deleteMany({ tenantId, date }),
        SaleCommissionSector.deleteMany({ tenantId, date }),
    ])
}
