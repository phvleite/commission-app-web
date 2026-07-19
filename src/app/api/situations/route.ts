import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Situation } from '@/models/Situation'

export async function GET() {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    await connectDB()

    const situations = await Situation.find({ tenantId })
        .populate('employeeId', 'name')
        .populate('typeId', 'description')
        .sort({ startDate: -1 })
        .lean()

    return NextResponse.json({
        situations: situations.map((s) => ({
            _id: String(s._id),
            employeeId: String(s.employeeId._id),
            employeeName: s.employeeId.name,
            typeId: String(s.typeId._id),
            typeDescription: s.typeId.description,
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

    try {
        const created = await Situation.create({
            tenantId,
            employeeId,
            typeId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            active: true,
        })

        return NextResponse.json({
            _id: String(created._id),
            ok: true,
        })
    } catch {
        return NextResponse.json({ error: 'Erro ao criar situação.' }, { status: 500 })
    }
}
