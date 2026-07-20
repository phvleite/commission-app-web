import { connectDB } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { User, type UserRole } from '@/models/User'
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
    tenantName: string
}

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

    // Buscar o nome da empresa (Tenant)
    const tenant = await Tenant.findById(user.tenantId).select('name').lean()
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
    }
}
