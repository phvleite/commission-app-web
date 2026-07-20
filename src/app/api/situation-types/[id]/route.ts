import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { SituationType } from '@/models/SituationType'

function isMongoDuplicateKeyError(error: unknown): error is { code: number } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 11000
    )
}

interface Params {
    params: Promise<{ id: string }>
}

export async function PUT(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { id } = await context.params
    const { description } = await req.json()

    if (!description?.trim()) {
        return NextResponse.json({ error: 'Descrição obrigatória.' }, { status: 400 })
    }

    await connectDB()

    try {
        const updated = await SituationType.findOneAndUpdate(
            { _id: id, tenantId },
            { description: description.trim() },
            { returnDocument: 'after' },
        )

        return NextResponse.json(updated)
    } catch (err: unknown) {
        if (isMongoDuplicateKeyError(err)) {
            return NextResponse.json(
                { error: 'Já existe um tipo com essa descrição.' },
                { status: 400 },
            )
        }

        return NextResponse.json({ error: 'Erro ao editar tipo.' }, { status: 500 })
    }
}

export async function PATCH(req: Request, context: Params) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { id } = await context.params
    const { active } = await req.json()

    await connectDB()

    const updated = await SituationType.findOneAndUpdate(
        { _id: id, tenantId },
        { active: Boolean(active) },
        { returnDocument: 'after' },
    )

    return NextResponse.json(updated)
}
