import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { User, type PlatformRole } from '@/models/User'

const PLATFORM_EMAIL_DOMAIN = '@commission.com.br'

function toExactCaseInsensitiveEmailRegex(value: string): RegExp {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}$`, 'i')
}

function canManagePlatformUsers(platformRole?: PlatformRole): boolean {
    return platformRole === 'platform_owner' || platformRole === 'platform_admin'
}

function isPlatformAdminRole(value?: string | null): value is PlatformRole {
    return value === 'platform_owner' || value === 'platform_admin' || value === 'platform_auditor'
}

function isAllowedPlatformRole(
    value: PlatformRole,
): value is Exclude<PlatformRole, 'platform_owner'> {
    return value === 'platform_admin' || value === 'platform_auditor'
}
export async function GET() {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!session.user.platformRole) {
        return Response.json({ error: 'Sem permissao para acessar.' }, { status: 403 })
    }

    await connectDB()

    const users = await User.find({
        platformRole: { $exists: true, $ne: null },
    })
        .sort({ name: 1 })
        .select('-passwordHash')
        .lean()

    return Response.json({
        data: users.map((user) => ({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            platformRole: user.platformRole,
            active: user.active,
            createdAt: user.createdAt,
        })),
    })
}

export async function POST(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManagePlatformUsers(session.user.platformRole)) {
        return Response.json({ error: 'Sem permissao para criar usuario.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        name?: string
        email?: string
        password?: string
        passwordConfirmation?: string
        platformRole?: PlatformRole
    }

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const passwordConfirmation = body.passwordConfirmation
    const platformRole = body.platformRole

    if (!name || !email || !password || !passwordConfirmation || !platformRole) {
        return Response.json(
            {
                error: 'name, email, password, passwordConfirmation e platformRole sao obrigatorios.',
            },
            { status: 400 },
        )
    }

    if (!isAllowedPlatformRole(platformRole)) {
        return Response.json({ error: 'platformRole invalido.' }, { status: 400 })
    }

    if (!email.endsWith(PLATFORM_EMAIL_DOMAIN)) {
        return Response.json(
            { error: 'Usuarios de plataforma devem usar email @commission.com.br.' },
            { status: 400 },
        )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return Response.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    if (password.length < 8) {
        return Response.json(
            { error: 'A senha precisa ter no minimo 8 caracteres.' },
            { status: 400 },
        )
    }

    if (password !== passwordConfirmation) {
        return Response.json({ error: 'A confirmacao de senha nao confere.' }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({
        email: toExactCaseInsensitiveEmailRegex(email),
    })
        .select('_id')
        .lean()

    if (existingUser) {
        return Response.json({ error: 'Ja existe usuario com este email.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const now = new Date()

    const insertResult = await User.collection.insertOne({
        name,
        email,
        passwordHash,
        role: 'admin',
        platformRole,
        active: true,
        createdAt: now,
        updatedAt: now,
    })

    const createdUser = await User.findById(insertResult.insertedId).select('-passwordHash').lean()

    if (!createdUser) {
        return Response.json({ error: 'Nao foi possivel criar o usuario.' }, { status: 500 })
    }

    return Response.json(
        {
            data: {
                _id: createdUser._id.toString(),
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                platformRole: createdUser.platformRole,
                active: createdUser.active,
                createdAt: createdUser.createdAt,
            },
        },
        { status: 201 },
    )
}

export async function PATCH(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManagePlatformUsers(session.user.platformRole)) {
        return Response.json({ error: 'Sem permissao para editar usuario.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        id?: string
        active?: boolean
    }

    const id = body.id?.trim()

    if (!id) {
        return Response.json({ error: 'id e obrigatorio.' }, { status: 400 })
    }

    if (typeof body.active !== 'boolean') {
        return Response.json({ error: 'active deve ser boolean.' }, { status: 400 })
    }

    if (session.user.id === id && body.active === false) {
        return Response.json(
            { error: 'Nao e permitido inativar o proprio usuario.' },
            { status: 400 },
        )
    }

    if (!/^([a-f\d]{24})$/i.test(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    await connectDB()

    const targetUser = await User.findById(id)

    if (!targetUser || !isPlatformAdminRole(targetUser.platformRole)) {
        return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    if (targetUser.platformRole === 'platform_owner' && body.active === false) {
        const totalActiveOwners = await User.countDocuments({
            platformRole: 'platform_owner',
            active: true,
        })

        if (totalActiveOwners <= 1) {
            return Response.json(
                { error: 'Nao e permitido inativar o ultimo platform owner.' },
                { status: 400 },
            )
        }
    }

    await User.collection.updateOne(
        { _id: targetUser._id },
        { $set: { active: body.active, updatedAt: new Date() } },
    )

    const safeUser = await User.findById(targetUser._id).select('-passwordHash').lean()

    return Response.json({
        data: safeUser
            ? {
                  _id: safeUser._id.toString(),
                  name: safeUser.name,
                  email: safeUser.email,
                  role: safeUser.role,
                  platformRole: safeUser.platformRole,
                  active: safeUser.active,
                  createdAt: safeUser.createdAt,
              }
            : null,
    })
}

export async function PUT(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManagePlatformUsers(session.user.platformRole)) {
        return Response.json({ error: 'Sem permissao para editar usuario.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        id?: string
        name?: string
        email?: string
        platformRole?: PlatformRole
    }

    const id = body.id?.trim()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const platformRole = body.platformRole

    if (!id || !name || !email || !platformRole) {
        return Response.json(
            { error: 'id, name, email e platformRole sao obrigatorios.' },
            { status: 400 },
        )
    }

    if (!/^([a-f\d]{24})$/i.test(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    if (!isAllowedPlatformRole(platformRole)) {
        return Response.json({ error: 'platformRole invalido.' }, { status: 400 })
    }

    if (!email.endsWith(PLATFORM_EMAIL_DOMAIN)) {
        return Response.json(
            { error: 'Usuarios de plataforma devem usar email @commission.com.br.' },
            { status: 400 },
        )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return Response.json({ error: 'Informe um email valido.' }, { status: 400 })
    }

    await connectDB()

    const targetUser = await User.findById(id)

    if (!targetUser || !isPlatformAdminRole(targetUser.platformRole)) {
        return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    const existingUser = await User.findOne({
        email: toExactCaseInsensitiveEmailRegex(email),
        _id: { $ne: id },
    })
        .select('_id')
        .lean()

    if (existingUser) {
        return Response.json({ error: 'Ja existe usuario com este email.' }, { status: 409 })
    }

    await User.collection.updateOne(
        { _id: targetUser._id },
        {
            $set: {
                name,
                email,
                platformRole,
                updatedAt: new Date(),
            },
        },
    )

    const safeUser = await User.findById(targetUser._id).select('-passwordHash').lean()

    return Response.json({
        data: safeUser
            ? {
                  _id: safeUser._id.toString(),
                  name: safeUser.name,
                  email: safeUser.email,
                  role: safeUser.role,
                  platformRole: safeUser.platformRole,
                  active: safeUser.active,
                  createdAt: safeUser.createdAt,
              }
            : null,
    })
}
