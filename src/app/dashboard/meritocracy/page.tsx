import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Employee } from '@/models/Employee'
import {
    MeritocracyAllocation,
    type MeritocracyAllocationDocument,
} from '@/models/MeritocracyAllocation'
import { Sector } from '@/models/Sector'
import { MeritocracyClientContainer } from './MeritocracyClientContainer'
import type { MeritocracyAllocationItem } from './MeritocracyClient'

function serializeAllocation(allocation: MeritocracyAllocationDocument): MeritocracyAllocationItem {
    return {
        _id: allocation._id.toString(),
        competence: allocation.competence,
        periodStart: allocation.periodStart.toISOString(),
        periodEnd: allocation.periodEnd.toISOString(),
        paymentDate: allocation.paymentDate.toISOString(),
        totalMeritocracyValue: allocation.totalMeritocracyValue,
        recipientCount: allocation.recipientCount,
        status: allocation.status,
        cancelReason: allocation.cancelReason ?? null,
        cancelledAt: allocation.cancelledAt ? allocation.cancelledAt.toISOString() : null,
        ignoredEmployees: (allocation.ignoredEmployees ?? []).map((employee) => ({
            employeeId: employee.employeeId.toString(),
            employeeName: employee.employeeName,
            reason: employee.reason,
        })),
        recipients: allocation.recipients.map((recipient) => ({
            employeeId: recipient.employeeId.toString(),
            employeeName: recipient.employeeName,
            sectorId: recipient.sectorId.toString(),
            sectorName: recipient.sectorName,
            employeeValue: recipient.employeeValue,
        })),
    }
}

export default async function MeritocracyPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const tenantId = session.user.tenantId

    await connectDB()

    const meritocracySector = await Sector.findOne({ tenantId, isMeritocracia: true }).lean()

    // A meritocracia só existe enquanto houver o setor correspondente cadastrado.
    if (!meritocracySector) {
        redirect('/dashboard')
    }

    const sectors = await Sector.find({ tenantId, isMeritocracia: { $ne: true }, active: true })
        .sort({ name: 1 })
        .lean()

    const employees = await Employee.find({ tenantId }).sort({ name: 1 }).lean()

    const sectorNameById = new Map(sectors.map((sector) => [sector._id.toString(), sector.name]))

    const initialSectors = sectors.map((sector) => ({
        _id: sector._id.toString(),
        name: sector.name,
    }))

    const initialEmployees = employees.map((employee) => ({
        _id: employee._id.toString(),
        name: employee.name,
        sectorId: employee.sectorId.toString(),
        sectorName: sectorNameById.get(employee.sectorId.toString()) ?? 'Setor não encontrado',
        active: employee.active,
    }))

    const allocations = await MeritocracyAllocation.find({ tenantId })
        .sort({ competence: -1 })
        .limit(24)

    const initialAllocations = allocations.map((allocation) => serializeAllocation(allocation))

    return (
        <MeritocracyClientContainer
            userRole={session.user.role}
            initialSectors={initialSectors}
            initialEmployees={initialEmployees}
            initialAllocations={initialAllocations}
        />
    )
}
