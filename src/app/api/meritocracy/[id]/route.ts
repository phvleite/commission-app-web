import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'

interface RouteContext {
    params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    try {
        await connectDB()

        const allocation = await MeritocracyAllocation.findOne({
            _id: id,
            tenantId: user.tenantId,
        }).lean()

        if (!allocation) {
            return Response.json({ error: 'Lancamento nao encontrado.' }, { status: 404 })
        }

        return Response.json({ data: allocation })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return Response.json({ error: 'Erro ao consultar lancamento.' }, { status: 500 })
    }
}
