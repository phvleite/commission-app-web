import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
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
        return Response.json({ error: 'Sem permissao para editar setor.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    const body = (await request.json()) as {
        name?: string
        percentage?: number
        active?: boolean
        isMeritocracia?: boolean
    }

    const update: Record<string, unknown> = {}

    if (body.name !== undefined) {
        const name = body.name.trim()
        if (!name) {
            return Response.json({ error: 'name nao pode ser vazio.' }, { status: 400 })
        }
        update.name = name
    }

    if (body.percentage !== undefined) {
        if (typeof body.percentage !== 'number' || body.percentage < 0 || body.percentage > 100) {
            return Response.json({ error: 'percentage deve estar entre 0 e 100.' }, { status: 400 })
        }
        update.percentage = body.percentage
    }

    if (body.active !== undefined) {
        update.active = Boolean(body.active)
    }

    if (body.isMeritocracia !== undefined) {
        update.isMeritocracia = Boolean(body.isMeritocracia)
    }

    await connectDB()

    const sector = await Sector.findOne({ _id: id, tenantId: user.tenantId })

    if (!sector) {
        return Response.json({ error: 'Setor nao encontrado.' }, { status: 404 })
    }

    try {
        Object.assign(sector, update)
        await sector.save()
        return Response.json({ data: sector })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return Response.json(
                { error: 'Setor com este nome ja existe no tenant.' },
                { status: 409 },
            )
        }

        return Response.json({ error: 'Nao foi possivel atualizar o setor.' }, { status: 500 })
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para excluir setor.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    await connectDB()

    const sector = await Sector.findOne({ _id: id, tenantId: user.tenantId })

    if (!sector) {
        return Response.json({ error: 'Setor nao encontrado.' }, { status: 404 })
    }

    sector.active = false
    await sector.save()

    return Response.json({ data: sector })
}
