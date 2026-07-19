import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { EmployeesClientContainer } from './EmployeesClientContainer'

export default async function EmployeesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const tenantId = session.user.tenantId

    // ===========================
    // BUSCAR SETORES (sem meritocracia)
    // ===========================
    const sectors = await Sector.find({
        tenantId,
        isMeritocracia: false,
    })
        .sort({ name: 1 })
        .lean()

    const initialSectors = sectors.map((s) => ({
        _id: s._id.toString(),
        name: s.name,
    }))

    // ===========================
    // BUSCAR COLABORADORES
    // ===========================
    const employees = await Employee.find({
        tenantId,
    })
        .sort({ name: 1 })
        .lean()

    const initialEmployees = employees.map((e) => ({
        _id: e._id.toString(),
        name: e.name,
        sectorId: e.sectorId.toString(),
        sectorName:
            initialSectors.find((s) => s._id === e.sectorId.toString())?.name ??
            'Setor não encontrado',
        admissionDate: e.admissionDate.toISOString().slice(0, 10),
        dismissalDate: e.dismissalDate ? e.dismissalDate.toISOString().slice(0, 10) : null,
        active: e.active,
    }))

    return (
        <EmployeesClientContainer
            userRole={session.user.role}
            initialEmployees={initialEmployees}
            initialSectors={initialSectors}
        />
    )
}
