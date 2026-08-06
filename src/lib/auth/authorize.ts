import { connectDB } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { User, type PlatformRole, type UserRole } from '@/models/User'
import { Tenant } from '@/models/Tenant'

export interface AuthorizeCredentialsInput {
    email?: string
    password?: string
}

export interface AuthorizedUser {
    id: string
    tenantId: string
    name: string
    email: string
    role: UserRole
    platformRole?: PlatformRole
    tenantName: string
    tenantTimeZone?: string
}

const PLATFORM_ADMIN_EMAIL_DOMAIN = '@commission.com.br'

export async function authorizeCredentials({
    email: rawEmail,
    password: rawPassword,
}: AuthorizeCredentialsInput): Promise<AuthorizedUser | null> {
    const email = rawEmail?.trim().toLowerCase()
    const password = rawPassword

    if (!email || !password) {
        return null
    }

    await connectDB()

    const users = await User.find({
        email,
        active: true,
    })
        .limit(2)
        .lean()

    if (users.length !== 1) {
        return null
    }

    const user = users[0]
    if (!user) {
        return null
    }

    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) {
        return null
    }

    if (user.platformRole) {
        if (!email.endsWith(PLATFORM_ADMIN_EMAIL_DOMAIN)) {
            return null
        }

        return {
            id: user._id.toString(),
            tenantId: '',
            name: user.name,
            email: user.email,
            role: user.role,
            platformRole: user.platformRole,
            tenantName: 'Plataforma Commission',
            tenantTimeZone: undefined,
        }
    }

    // Buscar o nome da empresa (Tenant)
    const tenant = await Tenant.findById(user.tenantId).select('name timeZone').lean()
    if (!tenant) {
        return null
    }

    return {
        id: user._id.toString(),
        tenantId: user.tenantId.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantName: tenant.name,
        tenantTimeZone: typeof tenant.timeZone === 'string' ? tenant.timeZone : undefined,
    }
}
