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

export async function GET() {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    await connectDB()

    const types = await SituationType.find({ tenantId }).sort({ description: 1 }).lean()

    return NextResponse.json({
        types: types.map((t) => ({
            _id: String(t._id),
            description: t.description,
            active: t.active,
        })),
    })
}

export async function POST(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { description } = await req.json()

    if (!description?.trim()) {
        return NextResponse.json({ error: 'Descrição obrigatória.' }, { status: 400 })
    }

    await connectDB()

    try {
        const created = await SituationType.create({
            tenantId,
            description: description.trim(),
            active: true,
        })

        return NextResponse.json({
            _id: String(created._id),
            description: created.description,
            active: created.active,
        })
    } catch (err: unknown) {
        if (isMongoDuplicateKeyError(err)) {
            return NextResponse.json(
                { error: 'Já existe um tipo com essa descrição.' },
                { status: 400 },
            )
        }

        return NextResponse.json({ error: 'Erro ao criar tipo.' }, { status: 500 })
    }
}
