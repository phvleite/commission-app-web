import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { resolveRequestTimeZone } from '@/lib/date-timezone'
import { meritocracyErrorResponse } from '@/lib/api/meritocracy-errors'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import {
    MeritocracyAllocationError,
    generateMeritocracyAllocation,
} from '@/services/meritocracy/generateMeritocracyAllocation'

export async function GET(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const competence = searchParams.get('competence')

    try {
        await connectDB()

        const query: Record<string, unknown> = { tenantId: user.tenantId }
        if (competence) {
            query.competence = competence
        }

        const allocations = await MeritocracyAllocation.find(query).sort({ competence: -1 }).lean()

        return Response.json({ data: allocations })
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

        return Response.json(
            { error: 'Erro ao consultar lançamentos de meritocracia.' },
            { status: 500 },
        )
    }
}

export async function POST(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para lancar meritocracia.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        competence?: string
        selectedSectorIds?: string[]
        includedEmployeeIds?: string[]
        excludedEmployeeIds?: string[]
    }

    if (!body.competence || typeof body.competence !== 'string') {
        return Response.json({ error: 'Informe a competencia (AAAA-MM).' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(request, user.tenantTimeZone)

    try {
        const allocation = await generateMeritocracyAllocation({
            tenantId: user.tenantId,
            competence: body.competence,
            timeZone,
            selectedSectorIds: body.selectedSectorIds ?? [],
            includedEmployeeIds: body.includedEmployeeIds ?? [],
            excludedEmployeeIds: body.excludedEmployeeIds ?? [],
            createdBy: user.id,
        })

        return Response.json({ data: allocation }, { status: 201 })
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

        return Response.json({ error: 'Erro ao lancar meritocracia.' }, { status: 500 })
    }
}
