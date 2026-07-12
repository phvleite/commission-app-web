import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { CompanyUsersClient } from './CompanyUsersClient'

export default async function CompanyUsersPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    await connectDB()

    const tenant = await Tenant.findById(session.user.tenantId).lean()
    const users = await User.find({ tenantId: session.user.tenantId })
        .sort({ name: 1 })
        .select('-passwordHash')
        .lean()

    const initialCompany = tenant
        ? {
              _id: tenant._id.toString(),
              name: tenant.name,
              legalName: tenant.legalName,
              slug: tenant.slug,
              address: tenant.address
                  ? {
                        street: tenant.address.street,
                        number: tenant.address.number,
                        neighborhood: tenant.address.neighborhood,
                        city: tenant.address.city,
                        state: tenant.address.state,
                        zipCode: tenant.address.zipCode,
                    }
                  : undefined,
          }
        : null

    const initialUsers = users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
    }))

    return (
        <CompanyUsersClient
            userRole={session.user.role}
            initialCompany={initialCompany}
            initialUsers={initialUsers}
        />
    )
}
