import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import {
    sectorPercentageBlockedResponse,
    validateActiveSectorsPercentage,
} from '@/lib/api/business-rules'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'

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
        admissionDate?: string
        dismissalDate?: string
        active?: boolean
    }

    const update: Record<string, unknown> = {}

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

    if (body.admissionDate !== undefined) {
        const parsed = new Date(body.admissionDate)
        if (Number.isNaN(parsed.getTime())) {
            return Response.json({ error: 'admissionDate invalida.' }, { status: 400 })
        }
        update.admissionDate = parsed
    }

    if (body.dismissalDate !== undefined) {
        if (body.dismissalDate === '') {
            update.dismissalDate = undefined
        } else {
            const parsed = new Date(body.dismissalDate)
            if (Number.isNaN(parsed.getTime())) {
                return Response.json({ error: 'dismissalDate invalida.' }, { status: 400 })
            }
            update.dismissalDate = parsed
        }
    }

    if (body.active !== undefined) {
        update.active = Boolean(body.active)
    }

    await connectDB()

    const sectorsValidation = await validateActiveSectorsPercentage(user.tenantId)
    if (!sectorsValidation.valid) {
        return sectorPercentageBlockedResponse(sectorsValidation.total)
    }

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
    }

    const employee = await Employee.findOne({ _id: id, tenantId: user.tenantId })

    if (!employee) {
        return Response.json({ error: 'Colaborador nao encontrado.' }, { status: 404 })
    }

    Object.assign(employee, update)
    await employee.save()

    return Response.json({ data: employee })
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

    await connectDB()

    const sectorsValidation = await validateActiveSectorsPercentage(user.tenantId)
    if (!sectorsValidation.valid) {
        return sectorPercentageBlockedResponse(sectorsValidation.total)
    }

    const employee = await Employee.findOne({ _id: id, tenantId: user.tenantId })

    if (!employee) {
        return Response.json({ error: 'Colaborador nao encontrado.' }, { status: 404 })
    }

    employee.active = false
    await employee.save()

    return Response.json({ data: employee })
}
