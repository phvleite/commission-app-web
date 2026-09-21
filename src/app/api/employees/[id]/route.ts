import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'
import { getEmployeePlanRangeWarning } from '@/services/employees/getEmployeePlanRangeWarning'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { updateEmployeeWithHistory } from '@/services/employees/updateEmployeeWithHistory'
interface RouteContext {
    params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para editar colaborador.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    const body = (await request.json()) as {
        name?: string
        sectorId?: string
        sectorChangeDate?: string
        admissionDate?: string
        dismissalDate?: string | null
        active?: boolean
    }

    const update: Record<string, unknown> = {}
    let sectorChangeDate: Date | undefined

    if (body.name !== undefined) {
        const name = body.name.trim()
        if (!name) {
            return Response.json({ error: 'name nao pode ser vazio.' }, { status: 400 })
        }
        update.name = name
    }

    if (body.sectorId !== undefined) {
        if (!Types.ObjectId.isValid(body.sectorId)) {
            return Response.json({ error: 'sectorId invalido.' }, { status: 400 })
        }
        update.sectorId = body.sectorId
    }

    if (body.sectorChangeDate !== undefined) {
        sectorChangeDate = new Date(body.sectorChangeDate)
        if (Number.isNaN(sectorChangeDate.getTime())) {
            return Response.json({ error: 'sectorChangeDate invalida.' }, { status: 400 })
        }
    }

    if (body.admissionDate !== undefined) {
        const parsed = new Date(body.admissionDate)
        if (Number.isNaN(parsed.getTime())) {
            return Response.json({ error: 'admissionDate invalida.' }, { status: 400 })
        }
        update.admissionDate = parsed
    }

    if (body.dismissalDate !== undefined) {
        if (body.dismissalDate === '' || body.dismissalDate === null) {
            update.dismissalDate = undefined
            update.active = true
        } else {
            const parsed = new Date(body.dismissalDate)
            if (Number.isNaN(parsed.getTime())) {
                return Response.json({ error: 'dismissalDate invalida.' }, { status: 400 })
            }
            update.dismissalDate = parsed
            update.active = false
        }
    }

    try {
        await connectDB()

        if (update.sectorId) {
            const sector = await Sector.findOne({
                _id: update.sectorId,
                tenantId: user.tenantId,
            }).lean()

            if (!sector) {
                return Response.json(
                    { error: 'Setor nao encontrado para este tenant.' },
                    { status: 404 },
                )
            }

            if (sector.isMeritocracia) {
                return Response.json(
                    { error: 'Setor de meritocracia nao pode ser vinculado a colaborador.' },
                    { status: 400 },
                )
            }
        }

        const employee = await updateEmployeeWithHistory({
            tenantId: user.tenantId,
            employeeId: id,
            updatedBy: user.id,
            name: update.name as string | undefined,
            sectorId: update.sectorId as string | undefined,
            sectorChangeDate,
            admissionDate: update.admissionDate as Date | undefined,
            dismissalDate:
                body.dismissalDate === undefined
                    ? undefined
                    : ((update.dismissalDate as Date | undefined) ?? null),
        })

        let warning: string | undefined
        try {
            warning = await getEmployeePlanRangeWarning(user.tenantId)
        } catch (error) {
            if (!isDatabaseConnectionError(error)) {
                throw error
            }
        }

        return Response.json({ data: employee, warning })
    } catch (error) {
        const message = error instanceof Error ? error.message : ''

        if (message === 'EMPLOYEE_NOT_FOUND') {
            return Response.json({ error: 'Colaborador nao encontrado.' }, { status: 404 })
        }

        const validationErrors: Record<string, string> = {
            SECTOR_CHANGE_DATE_REQUIRED: 'Informe a data da mudança de setor.',
            SECTOR_CHANGE_DATE_INVALID:
                'A data da mudança deve ser posterior ao início do setor atual.',
            SECTOR_CHANGE_BEFORE_ADMISSION: 'A mudança de setor não pode ser anterior à admissão.',
            SECTOR_CHANGE_AFTER_DISMISSAL: 'A mudança de setor não pode ser posterior à demissão.',
            DISMISSAL_BEFORE_ADMISSION: 'A demissão não pode ser anterior à admissão.',
            DISMISSAL_BEFORE_CURRENT_SECTOR:
                'A demissão não pode ser anterior ao início do setor atual.',
            ADMISSION_AFTER_FIRST_HISTORY:
                'A admissão não pode ser posterior ao fim do primeiro vínculo setorial.',
        }

        if (validationErrors[message]) {
            return Response.json({ error: validationErrors[message] }, { status: 400 })
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

        return Response.json({ error: 'Erro ao editar colaborador.' }, { status: 500 })
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para inativar colaborador.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    try {
        await connectDB()

        const employee = await Employee.findOne({ _id: id, tenantId: user.tenantId })

        if (!employee) {
            return Response.json({ error: 'Colaborador nao encontrado.' }, { status: 404 })
        }

        employee.active = false
        await employee.save()

        return Response.json({ data: employee })
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

        return Response.json({ error: 'Erro ao inativar colaborador.' }, { status: 500 })
    }
}
