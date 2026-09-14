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

    try {
        await connectDB()

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

        if (isDatabaseConnectionError(err)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
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

    try {
        await connectDB()

        const updated = await SituationType.findOneAndUpdate(
            { _id: id, tenantId },
            { active: Boolean(active) },
            { returnDocument: 'after' },
        )

        return NextResponse.json(updated)
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

        return NextResponse.json({ error: 'Erro ao atualizar tipo.' }, { status: 500 })
    }
}
