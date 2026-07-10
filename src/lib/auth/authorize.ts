import { connectDB } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { Tenant } from '@/models/Tenant'
import { User, type UserRole } from '@/models/User'

export interface AuthorizeCredentialsInput {
    tenantSlug?: string
    email?: string
    password?: string
}

export interface AuthorizedUser {
    id: string
    tenantId: string
    name: string
    email: string
    role: UserRole
}

export async function authorizeCredentials(
    credentials: AuthorizeCredentialsInput,
): Promise<AuthorizedUser | null> {
    const tenantSlug = credentials.tenantSlug?.trim().toLowerCase()
    const email = credentials.email?.trim().toLowerCase()
    const password = credentials.password

    if (!tenantSlug || !email || !password) {
        return null
    }

    await connectDB()

    const tenant = await Tenant.findOne({ slug: tenantSlug, active: true }).lean()
    if (!tenant) {
        return null
    }

    const user = await User.findOne({ tenantId: tenant._id, email, active: true }).lean()
    if (!user) {
        return null
    }

    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) {
        return null
    }

    return {
        id: user._id.toString(),
        tenantId: user.tenantId.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
    }
}
