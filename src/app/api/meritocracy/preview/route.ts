import { getRouteSessionUser } from '@/lib/api/route-auth'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { resolveRequestTimeZone } from '@/lib/date-timezone'
import { meritocracyErrorResponse } from '@/lib/api/meritocracy-errors'
import {
    calculateMeritocracyValue,
    MeritocracyAllocationError,
} from '@/services/meritocracy/generateMeritocracyAllocation'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'

export async function GET(request: Request) {
    const user = await getRouteSessionUser()
    if (!user) return Response.json({ error: 'Nao autenticado.' }, { status: 401 })

    const competence = new URL(request.url).searchParams.get('competence')
    if (!competence)
        return Response.json({ error: 'Informe a competencia (AAAA-MM).' }, { status: 400 })

    try {
        const timeZone = resolveRequestTimeZone(request, user.tenantTimeZone)
        const preview = await calculateMeritocracyValue({
            tenantId: user.tenantId,
            competence,
            timeZone,
        })
        const allocation = await MeritocracyAllocation.findOne({
            tenantId: user.tenantId,
            competence,
            status: 'success',
        })
            .select('_id')
            .lean()

        return Response.json({
            data: {
                competence,
                totalMeritocracyValue: preview.totalMeritocracyValue,
                hasActiveAllocation: Boolean(allocation),
            },
        })
    } catch (error) {
        if (error instanceof MeritocracyAllocationError) return meritocracyErrorResponse(error)
        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }
        return Response.json(
            { error: 'Erro ao consultar o valor da meritocracia.' },
            { status: 500 },
        )
    }
}
