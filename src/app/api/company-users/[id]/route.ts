import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { User } from '@/models/User'
import { isValidCpf, normalizeCpf } from '@/lib/validators/cpf'

export interface RouteContext {
    params: Promise<{ id: string }>
}

function toExactCaseInsensitiveEmailRegex(value: string): RegExp {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}$`, 'i')
}

function canManageUsers(role: 'admin' | 'manager' | 'seller'): boolean {
    return role === 'admin'
}

function isValidRole(value: string): value is 'admin' | 'manager' | 'seller' {
    return value === 'admin' || value === 'manager' || value === 'seller'
}

export async function PUT(request: Request, context: RouteContext) {
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
        name?: string
        email?: string
        cpf?: string
        phone?: string
        role?: string
    }

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const phone = body.phone?.trim() || undefined
    const role = body.role
    const cpf = body.cpf?.trim() ? normalizeCpf(body.cpf) : undefined

    if (!name || !email || !role) {
        return Response.json({ error: 'name, email e role sao obrigatorios.' }, { status: 400 })
    }

    if (!isValidRole(role)) {
        return Response.json({ error: 'role invalido.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return Response.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    if (cpf && !isValidCpf(cpf)) {
        return Response.json({ error: 'Informe um CPF valido.' }, { status: 400 })
    }

    await connectDB()

    const targetUser = await User.findOne({ _id: id, tenantId: sessionUser.tenantId })

    if (!targetUser) {
        return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    if (targetUser.email.toLowerCase() !== email) {
        const existingUserEmail = await User.findOne({
            email: toExactCaseInsensitiveEmailRegex(email),
        })
            .select('_id')
            .lean()
        if (existingUserEmail) {
            return Response.json({ error: 'Ja existe usuario com este email.' }, { status: 409 })
        }
    }

    if (targetUser.role === 'admin' && role !== 'admin' && targetUser.active) {
        const totalActiveAdmins = await User.countDocuments({
            tenantId: sessionUser.tenantId,
            role: 'admin',
            active: true,
        })

        if (totalActiveAdmins <= 1) {
            return Response.json(
                { error: 'Nao e permitido remover o ultimo admin da empresa.' },
                { status: 400 },
            )
        }
    }

    targetUser.name = name
    targetUser.email = email
    targetUser.cpf = cpf
    targetUser.phone = phone
    targetUser.role = role

    try {
        await targetUser.save()
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return Response.json({ error: 'Ja existe usuario com este email.' }, { status: 409 })
        }

        return Response.json({ error: 'Nao foi possivel atualizar o usuario.' }, { status: 500 })
    }

    const safeUser = await User.findById(targetUser._id).select('-passwordHash').lean()
    return Response.json({ data: safeUser })
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
