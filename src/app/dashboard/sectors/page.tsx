import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Sector } from '@/models/Sector'
import { SectorsClient } from './SectorsClient'

export default async function SectorsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    await connectDB()

    const sectors = await Sector.find({ tenantId: session.user.tenantId }).sort({ name: 1 }).lean()

    const initialSectors = sectors.map((sector) => ({
        _id: sector._id.toString(),
        name: sector.name,
        percentage: sector.percentage,
        active: sector.active,
        isMeritocracia: sector.isMeritocracia,
    }))

    return <SectorsClient userRole={session.user.role} initialSectors={initialSectors} />
}
