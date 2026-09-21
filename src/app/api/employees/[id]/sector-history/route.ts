import { Types } from 'mongoose'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { connectDB } from '@/lib/db'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { Employee } from '@/models/Employee'
import { EmployeeSectorHistory } from '@/models/EmployeeSectorHistory'
import { Sector } from '@/models/Sector'
import { correctEmployeeSectorHistory } from '@/services/employees/correctEmployeeSectorHistory'

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

        const employeeExists = await Employee.exists({ _id: id, tenantId: user.tenantId })
        if (!employeeExists) {
            return Response.json({ error: 'Colaborador nao encontrado.' }, { status: 404 })
        }

        const histories = await EmployeeSectorHistory.find({
            tenantId: user.tenantId,
            employeeId: id,
        })
            .populate('sectorId', 'name')
            .sort({ startDate: -1 })
            .lean()

        return Response.json({
            data: histories.map((history) => {
                const sector = history.sectorId as unknown as {
                    _id?: { toString(): string }
                    name?: string
                }

                return {
                    _id: history._id.toString(),
                    sectorId: sector?._id?.toString() ?? String(history.sectorId),
                    sectorName: sector?.name ?? 'Setor não encontrado',
                    startDate: history.startDate.toISOString(),
                    endDate: history.endDate?.toISOString() ?? null,
                }
            }),
        })
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

        return Response.json({ error: 'Erro ao consultar histórico de setores.' }, { status: 500 })
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()
    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }
    if (user.role !== 'admin') {
        return Response.json(
            { error: 'Somente administradores podem corrigir o histórico.' },
            { status: 403 },
        )
    }

    const { id } = await context.params
    const body = (await request.json()) as {
        historyId?: string
        sectorId?: string
        startDate?: string
        endDate?: string | null
    }

    if (
        !Types.ObjectId.isValid(id) ||
        !body.historyId ||
        !Types.ObjectId.isValid(body.historyId) ||
        !body.sectorId ||
        !Types.ObjectId.isValid(body.sectorId) ||
        !body.startDate
    ) {
        return Response.json({ error: 'Dados da correção inválidos.' }, { status: 400 })
    }

    const startDate = new Date(body.startDate)
    const endDate = body.endDate ? new Date(body.endDate) : null
    if (Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
        return Response.json({ error: 'Datas inválidas.' }, { status: 400 })
    }

    try {
        await connectDB()
        const sector = await Sector.findOne({
            _id: body.sectorId,
            tenantId: user.tenantId,
            isMeritocracia: { $ne: true },
        }).lean()
        if (!sector) {
            return Response.json({ error: 'Setor inválido para este tenant.' }, { status: 400 })
        }

        await correctEmployeeSectorHistory({
            tenantId: user.tenantId,
            employeeId: id,
            historyId: body.historyId,
            sectorId: body.sectorId,
            startDate,
            endDate,
        })

        return GET(request, context)
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'EMPLOYEE_NOT_FOUND' || message === 'HISTORY_NOT_FOUND') {
            return Response.json({ error: 'Histórico não encontrado.' }, { status: 404 })
        }
        if (
            [
                'FIRST_HISTORY_MUST_START_AT_ADMISSION',
                'HISTORY_START_INVALID',
                'HISTORY_END_INVALID',
            ].includes(message)
        ) {
            return Response.json(
                {
                    error:
                        message === 'FIRST_HISTORY_MUST_START_AT_ADMISSION'
                            ? 'O primeiro vínculo deve começar na data de admissão.'
                            : 'As datas informadas criariam um período inválido.',
                },
                { status: 400 },
            )
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
        return Response.json({ error: 'Erro ao corrigir histórico de setores.' }, { status: 500 })
    }
}
