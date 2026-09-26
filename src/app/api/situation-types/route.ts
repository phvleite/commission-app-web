import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { SituationType } from '@/models/SituationType'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'

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

    try {
        await connectDB()

        const types = await SituationType.find({ tenantId }).sort({ description: 1 }).lean()

        return NextResponse.json({
            types: types.map((t) => ({
                _id: String(t._id),
                description: t.description,
                active: t.active,
            })),
        })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return NextResponse.json({ error: 'Erro ao consultar tipos de situação.' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    const { description } = await req.json()

    if (!description?.trim()) {
        return NextResponse.json({ error: 'Descrição obrigatória.' }, { status: 400 })
    }

    try {
        await connectDB()

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

        if (isDatabaseConnectionError(err)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return NextResponse.json({ error: 'Erro ao criar tipo.' }, { status: 500 })
    }
}
