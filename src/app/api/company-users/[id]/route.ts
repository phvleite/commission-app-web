import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { User } from '@/models/User'

export interface RouteContext {
    params: Promise<{ id: string }>
}

function canManageUsers(role: 'admin' | 'manager' | 'seller'): boolean {
    return role === 'admin'
}

export async function PATCH(request: Request, context: RouteContext) {
    const sessionUser = await getRouteSessionUser()

    if (!sessionUser) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManageUsers(sessionUser.role)) {
        return Response.json({ error: 'Sem permissao para editar usuario.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    const body = (await request.json()) as {
        active?: boolean
    }

    if (typeof body.active !== 'boolean') {
        return Response.json({ error: 'active deve ser boolean.' }, { status: 400 })
    }

    if (sessionUser.id === id && body.active === false) {
        return Response.json(
            { error: 'Nao e permitido inativar o proprio usuario.' },
            { status: 400 },
        )
    }

    await connectDB()

    const targetUser = await User.findOne({ _id: id, tenantId: sessionUser.tenantId })

    if (!targetUser) {
        return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    if (targetUser.role === 'admin' && body.active === false) {
        const totalActiveAdmins = await User.countDocuments({
            tenantId: sessionUser.tenantId,
            role: 'admin',
            active: true,
        })

        if (totalActiveAdmins <= 1) {
            return Response.json(
                { error: 'Nao e permitido inativar o ultimo admin da empresa.' },
                { status: 400 },
            )
        }
    }

    targetUser.active = body.active
    await targetUser.save()

    const safeUser = await User.findById(targetUser._id).select('-passwordHash').lean()

    return Response.json({ data: safeUser })
}
