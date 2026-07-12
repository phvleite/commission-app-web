import { connectDB } from '@/lib/db'
import { getRouteSessionUser } from '@/lib/api/route-auth'
import { hashPassword } from '@/lib/password'
import { User, type UserRole } from '@/models/User'

const ALLOWED_ROLES: UserRole[] = ['admin', 'manager', 'seller']

function canManageUsers(role: UserRole): boolean {
    return role === 'admin'
}

export async function GET() {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    await connectDB()

    const users = await User.find({ tenantId: user.tenantId })
        .sort({ name: 1 })
        .select('-passwordHash')
        .lean()

    return Response.json({ data: users })
}

export async function POST(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManageUsers(user.role)) {
        return Response.json({ error: 'Sem permissao para criar usuario.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        name?: string
        email?: string
        password?: string
        role?: UserRole
    }

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const role = body.role

    if (!name || !email || !password || !role) {
        return Response.json(
            { error: 'name, email, password e role sao obrigatorios.' },
            { status: 400 },
        )
    }

    if (!ALLOWED_ROLES.includes(role)) {
        return Response.json({ error: 'role invalido.' }, { status: 400 })
    }

    if (password.length < 8) {
        return Response.json(
            { error: 'A senha precisa ter no minimo 8 caracteres.' },
            { status: 400 },
        )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return Response.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    await connectDB()

    try {
        const passwordHash = await hashPassword(password)

        const newUser = await User.create({
            tenantId: user.tenantId,
            name,
            email,
            passwordHash,
            role,
            active: true,
        })

        const safeUser = await User.findById(newUser._id).select('-passwordHash').lean()
        return Response.json({ data: safeUser }, { status: 201 })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return Response.json(
                { error: 'Ja existe usuario com este email neste tenant.' },
                { status: 409 },
            )
        }

        const message = error instanceof Error ? error.message : ''
        if (message.includes('Limite de 2 usuarios por tenant')) {
            return Response.json({ error: message }, { status: 400 })
        }

        return Response.json({ error: 'Nao foi possivel criar o usuario.' }, { status: 500 })
    }
}
