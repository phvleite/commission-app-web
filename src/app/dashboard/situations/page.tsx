import { redirect } from 'next/navigation'
import SituationClientJSX from './SituationClientJSX'
import { SituationType } from '@/models/SituationType'
import { Situation } from '@/models/Situation'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { connectDB } from '@/lib/db'
import { auth } from '@/auth'
import { formatDateToYmdInTimeZone, normalizeTimeZone } from '@/lib/date-timezone'

export default async function Page() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }

    const tenantId = session.user.tenantId
    const timeZone = normalizeTimeZone(session.user.tenantTimeZone)

    await connectDB()

    // ============================================================
    // CARREGAR TIPOS DE SITUAÇÃO
    // ============================================================
    const types = await SituationType.find({ tenantId }).sort({ description: 1 }).lean()

    // ============================================================
    // CARREGAR COLABORADORES
    // ============================================================
    const employees = await Employee.find({ tenantId }).sort({ name: 1 }).lean()

    // ============================================================
    // CARREGAR SETORES
    // ============================================================
    const sectors = await Sector.find({ tenantId }).sort({ name: 1 }).lean()

    // ============================================================
    // CARREGAR SITUAÇÕES
    // ============================================================
    const pageSize = 50
    const totalItems = await Situation.countDocuments({ tenantId })
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    const situations = await Situation.find({
        tenantId,
    })
        .populate('employeeId', 'name active')
        .populate('typeId', 'description')
        .sort({ startDate: -1 })
        .limit(pageSize)
        .lean()

    // Normalizar para o formato usado no frontend
    const normalizedSituations = situations.map((s) => ({
        _id: String(s._id),
        employeeId: String(s.employeeId._id),
        employeeName: s.employeeId.name,
        employeeActive: s.employeeId.active,
        typeId: String(s.typeId._id),
        typeDescription: s.typeId.description,
        startDate: formatDateToYmdInTimeZone(s.startDate, timeZone),
        endDate: formatDateToYmdInTimeZone(s.endDate, timeZone),
        active: s.active,
    }))

    const normalizedTypes = types.map((t) => ({
        _id: String(t._id),
        description: t.description,
        active: t.active,
    }))

    const normalizedEmployees = employees.map((e) => ({
        _id: String(e._id),
        name: e.name,
        active: e.active,
    }))

    const normalizedSectors = sectors.map((s) => ({
        _id: String(s._id),
        name: s.name,
        active: s.active,
    }))

    return (
        <SituationClientJSX
            initialTypes={normalizedTypes}
            initialSituations={normalizedSituations}
            initialEmployees={normalizedEmployees}
            initialSectors={normalizedSectors}
            initialStartDate=""
            initialEndDate=""
            initialCurrentPage={1}
            initialTotalPages={totalPages}
            initialTotalItems={totalItems}
            initialPageSize={pageSize}
        />
    )
}
