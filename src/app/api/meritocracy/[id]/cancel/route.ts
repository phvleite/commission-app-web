import { Types } from 'mongoose'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { meritocracyErrorResponse } from '@/lib/api/meritocracy-errors'
import { cancelMeritocracyAllocation } from '@/services/meritocracy/cancelMeritocracyAllocation'
import { MeritocracyAllocationError } from '@/services/meritocracy/generateMeritocracyAllocation'

interface RouteContext {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json(
            { error: 'Sem permissao para cancelar meritocracia.' },
            { status: 403 },
        )
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    const body = (await request.json()) as { reason?: string }

    try {
        const allocation = await cancelMeritocracyAllocation({
            tenantId: user.tenantId,
            allocationId: id,
            reason: body.reason ?? '',
            cancelledBy: user.id,
        })

        return Response.json({ data: allocation })
    } catch (error) {
        if (error instanceof MeritocracyAllocationError) {
            return meritocracyErrorResponse(error)
        }

        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return Response.json({ error: 'Erro ao cancelar meritocracia.' }, { status: 500 })
    }
}
