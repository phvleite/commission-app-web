import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Situation } from '@/models/Situation'

interface Params {
    params: { id: string }
}

export async function PUT(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { id } = await context.params   // ✔ CORRETO

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

    const updated = await Situation.findOneAndUpdate(
        { _id: id, tenantId },
        {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            employeeId,
            typeId,
        },
        { returnDocument: 'after' }        // ✔ substitui "new: true"
    )

    return NextResponse.json(updated)
}

export async function PATCH(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { id } = await context.params   // ✔ CORRETO

    const { active } = await req.json()

    await connectDB()

    const updated = await Situation.findOneAndUpdate(
        { _id: id, tenantId },
        { active: Boolean(active) },
        { returnDocument: 'after' }        // ✔ substitui "new: true"
    )

    return NextResponse.json(updated)
}
