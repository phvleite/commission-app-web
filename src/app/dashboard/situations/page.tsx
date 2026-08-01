import { redirect } from 'next/navigation'
import SituationClientJSX from './SituationClientJSX'
import { SituationType } from '@/models/SituationType'
import { Situation } from '@/models/Situation'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { connectDB } from '@/lib/db'
import { auth } from '@/auth'
import {
    formatDateToYmdInTimeZone,
    getRollingWindowYmd,
    getUtcRangeForCalendarDay,
    normalizeTimeZone,
} from '@/lib/date-timezone'

export default async function Page() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }

    const tenantId = session.user.tenantId
    const timeZone = normalizeTimeZone(session.user.tenantTimeZone)
    const initialWindow = getRollingWindowYmd(45, timeZone)
    const startRange = getUtcRangeForCalendarDay(initialWindow.start, timeZone)
    const endRange = getUtcRangeForCalendarDay(initialWindow.end, timeZone)

    if (!startRange || !endRange) {
        throw new Error('Janela inicial de situacoes invalida.')
    }

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
    const situations = await Situation.find({
        tenantId,
        $and: [{ startDate: { $lte: endRange.end } }, { endDate: { $gte: startRange.start } }],
    })
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
            initialStartDate={initialWindow.start}
            initialEndDate={initialWindow.end}
        />
    )
}
