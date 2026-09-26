import { connectDB } from '@/lib/db'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { Types } from 'mongoose'

interface ResponsibleInput {
    userId?: Types.ObjectId
    name: string
    email: string
    cpf: string
    phone: string
    passwordHash?: string
}

export async function updateCompanyWithResponsible(
    tenantId: string,
    responsible: ResponsibleInput,
    tenantSet: Record<string, unknown>,
    tenantUnset: Record<string, 1>,
) {
    const db = await connectDB()
    const session = await db.startSession()

    try {
        let tenantResult: Record<string, unknown> | null = null
        let responsibleUserIdResult: Types.ObjectId | null = null

        await session.withTransaction(async () => {
            let responsibleUserId = responsible.userId

            if (responsibleUserId) {
                const responsibleUser = await User.findOne({
                    _id: responsibleUserId,
                    tenantId,
                }).session(session)

                if (!responsibleUser) {
                    responsibleUserId = undefined
                } else {
                    responsibleUser.name = responsible.name
                    responsibleUser.email = responsible.email
                    responsibleUser.cpf = responsible.cpf
                    responsibleUser.phone = responsible.phone
                    responsibleUser.role = 'admin'
                    responsibleUser.active = true

                    if (responsible.passwordHash) {
                        responsibleUser.passwordHash = responsible.passwordHash
                    }

                    await responsibleUser.save({ session })
                }
            }

            if (!responsibleUserId) {
                if (!responsible.passwordHash) {
                    throw new Error(
                        'Defina a senha do responsavel para concluir o cadastro de acesso.',
                    )
                }

                const [createdResponsible] = await User.create(
                    [
                        {
                            tenantId,
                            name: responsible.name,
                            email: responsible.email,
                            cpf: responsible.cpf,
                            phone: responsible.phone,
                            passwordHash: responsible.passwordHash,
                            role: 'admin',
                            active: true,
                        },
                    ],
                    { session },
                )

                responsibleUserId = createdResponsible._id
            }

            if (!responsibleUserId) {
                throw new Error('Responsavel nao foi definido.')
            }

            const tenant = await Tenant.findByIdAndUpdate(
                tenantId,
                {
                    $set: {
                        ...tenantSet,
                        responsibleUserId,
                    },
                    ...(Object.keys(tenantUnset).length > 0 ? { $unset: tenantUnset } : {}),
                },
                { returnDocument: 'after', session },
            ).lean()

            tenantResult = tenant as Record<string, unknown> | null
            responsibleUserIdResult = responsibleUserId
        })

        if (!tenantResult || !responsibleUserIdResult) {
            throw new Error('Empresa nao encontrada.')
        }

        return { tenant: tenantResult, responsibleUserId: responsibleUserIdResult }
    } finally {
        await session.endSession()
    }
}
