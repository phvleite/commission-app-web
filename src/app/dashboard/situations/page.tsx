import SituationClientJSX from './SituationClientJSX'
import { SituationType } from '@/models/SituationType'
import { Situation } from '@/models/Situation'
import { Employee } from '@/models/Employee'
import { connectDB } from '@/lib/db'
import { auth } from '@/auth'

export default async function Page() {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    await connectDB()

    // ============================================================
    // CARREGAR TIPOS DE SITUAÇÃO
    // ============================================================
    const types = await SituationType.find({ tenantId }).sort({ description: 1 }).lean()

    // ============================================================
    // CARREGAR COLABORADORES
    // ============================================================
    const employees = await Employee.find({ tenantId, active: true }).sort({ name: 1 }).lean()

    // ============================================================
    // CARREGAR SITUAÇÕES
    // ============================================================
    const situations = await Situation.find({ tenantId })
        .populate('employeeId', 'name')
        .populate('typeId', 'description')
        .sort({ startDate: -1 })
        .lean()

    // Normalizar para o formato usado no frontend
    const normalizedSituations = situations.map((s) => ({
        _id: String(s._id),
        employeeId: String(s.employeeId._id),
        employeeName: s.employeeId.name,
        typeId: String(s.typeId._id),
        typeDescription: s.typeId.description,
        startDate: s.startDate.toISOString().substring(0, 10),
        endDate: s.endDate.toISOString().substring(0, 10),
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
    }))

    return (
        <SituationClientJSX
            initialTypes={normalizedTypes}
            initialSituations={normalizedSituations}
            initialEmployees={normalizedEmployees}
        />
    )
}
