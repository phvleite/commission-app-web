import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Situation } from '@/models/Situation'
import { Employee } from '@/models/Employee'

export async function GET(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { searchParams } = new URL(req.url)

    const employeeId = searchParams.get('employeeId')
    const typeId = searchParams.get('typeId')
    const sectorId = searchParams.get('sectorId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    await connectDB()

    const query: Record<string, unknown> = { tenantId }

    if (employeeId && employeeId !== 'todos') query.employeeId = employeeId
    if (typeId && typeId !== 'todos') query.typeId = typeId

    // Se sectorId foi fornecido, buscar employees do setor
    if (sectorId && sectorId !== 'todos') {
        const employeesInSector = await Employee.find({ tenantId, sectorId }, '_id').lean()
        const employeeIds = employeesInSector.map((e) => e._id)
        query.employeeId = { $in: employeeIds }
    }

    if (start && end) {
        const startDate = new Date(start)
        const endDate = new Date(end)

        query.$and = [{ startDate: { $lte: endDate } }, { endDate: { $gte: startDate } }]
    } else if (month || year) {
        const y = year ? parseInt(year) : new Date().getFullYear()
        const m = month ? parseInt(month) - 1 : undefined

        const firstDay = m !== undefined ? new Date(y, m, 1) : new Date(y, 0, 1)
        const lastDay = m !== undefined ? new Date(y, m + 1, 0) : new Date(y, 11, 31)

        query.$and = [{ startDate: { $lte: lastDay } }, { endDate: { $gte: firstDay } }]
    }

    const situations = await Situation.find(query)
        .populate('employeeId', 'name')
        .populate('typeId', 'description')
        .sort({ startDate: -1 })
        .lean()

    return NextResponse.json({
        situations: situations.map((s) => ({
            _id: String(s._id),
            employeeId: String((s.employeeId as Record<string, unknown>)?._id ?? ''),
            employeeName: (s.employeeId as Record<string, unknown>)?.name ?? '',
            typeId: String((s.typeId as Record<string, unknown>)?._id ?? ''),
            typeDescription: (s.typeId as Record<string, unknown>)?.description ?? '',
            startDate: s.startDate.toISOString().substring(0, 10),
            endDate: s.endDate.toISOString().substring(0, 10),
            active: s.active,
        })),
    })
}

export async function POST(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { startDate, endDate, employeeId, typeId } = await req.json()

    if (!startDate || !endDate || !employeeId || !typeId) {
        return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    if (new Date(endDate) < new Date(startDate)) {
        return NextResponse.json(
            { error: 'A data final não pode ser menor que a inicial.' },
            { status: 400 },
        )
    }

    await connectDB()

    const created = await Situation.create({
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        employeeId,
        typeId,
        active: true,
    })

    return NextResponse.json({ _id: String(created._id) })
}
