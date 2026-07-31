import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { User } from '@/models/User'
import { hashPassword, verifyPassword } from '@/lib/password'

export interface RouteContext {
    params: Promise<{ id: string }>
}

function canManageUsers(role: 'admin' | 'manager' | 'seller'): boolean {
    return role === 'admin'
}

export async function POST(request: Request, context: RouteContext) {
    const sessionUser = await getRouteSessionUser()

    if (!sessionUser) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManageUsers(sessionUser.role)) {
        return Response.json({ error: 'Sem permissao para alterar senha.' }, { status: 403 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    const body = (await request.json()) as {
        currentPassword?: string
        newPassword?: string
        newPasswordConfirmation?: string
    }

    const currentPassword = body.currentPassword
    const newPassword = body.newPassword
    const newPasswordConfirmation = body.newPasswordConfirmation

    if (!currentPassword || !newPassword || !newPasswordConfirmation) {
        return Response.json(
            { error: 'Informe senha atual, nova senha e confirmacao.' },
            { status: 400 },
        )
    }

    if (newPassword.length < 8) {
        return Response.json(
            { error: 'A nova senha precisa ter no minimo 8 caracteres.' },
            { status: 400 },
        )
    }

    if (newPassword !== newPasswordConfirmation) {
        return Response.json({ error: 'A confirmacao da nova senha nao confere.' }, { status: 400 })
    }

    await connectDB()

    const targetUser = await User.findOne({ _id: id, tenantId: sessionUser.tenantId })

    if (!targetUser) {
        return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, targetUser.passwordHash)
    if (!isCurrentPasswordValid) {
        return Response.json({ error: 'Senha atual invalida.' }, { status: 400 })
    }

    targetUser.passwordHash = await hashPassword(newPassword)
    await targetUser.save()

    return Response.json({ ok: true })
}
