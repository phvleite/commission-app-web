import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

function requireEnv(name) {
    const value = process.env[name]
    if (!value || !value.trim()) {
        throw new Error(`Variavel obrigatoria ausente: ${name}`)
    }
    return value.trim()
}

function getOptionalEnv(name, defaultValue = '') {
    const value = process.env[name]
    if (!value || !value.trim()) {
        return defaultValue
    }
    return value.trim()
}

function toExactCaseInsensitiveEmailRegex(value) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}$`, 'i')
}

function parseTenantId(rawTenantId) {
    if (!rawTenantId) {
        return null
    }

    if (!mongoose.Types.ObjectId.isValid(rawTenantId)) {
        throw new Error(
            'PLATFORM_OWNER_TENANT_ID invalido. Informe um ObjectId valido ou deixe vazio.',
        )
    }

    return new mongoose.Types.ObjectId(rawTenantId)
}

async function main() {
    const mongoUri = requireEnv('MONGODB_URI')
    const email = requireEnv('PLATFORM_OWNER_EMAIL').toLowerCase()
    const password = requireEnv('PLATFORM_OWNER_PASSWORD')
    const name = getOptionalEnv('PLATFORM_OWNER_NAME', 'Platform Owner')
    const rawTenantId = getOptionalEnv('PLATFORM_OWNER_TENANT_ID', '')
    const forcePasswordReset = getOptionalEnv('PLATFORM_OWNER_FORCE_RESET_PASSWORD', 'false')

    const tenantId = parseTenantId(rawTenantId)

    await mongoose.connect(mongoUri)

    const users = mongoose.connection.db.collection('users')

    const existingUser = await users.findOne({ email: toExactCaseInsensitiveEmailRegex(email) })

    const passwordHash = await bcrypt.hash(password, 12)
    const now = new Date()

    if (existingUser) {
        const shouldReset = forcePasswordReset.toLowerCase() === 'true'

        if (!shouldReset) {
            console.log('Usuario ja existe. Nenhuma alteracao feita.')
            console.log(`Email: ${existingUser.email}`)
            return
        }

        await users.updateOne(
            { _id: existingUser._id },
            {
                $set: {
                    passwordHash,
                    name,
                    active: true,
                    role: existingUser.role ?? 'admin',
                    platformRole: 'platform_owner',
                    updatedAt: now,
                },
            },
        )

        console.log('Usuario existente atualizado com nova senha hash e role de plataforma.')
        console.log(`Email: ${existingUser.email}`)
        return
    }

    const newUser = {
        name,
        email,
        passwordHash,
        role: 'admin',
        active: true,
        platformRole: 'platform_owner',
        tenantId: tenantId ?? undefined,
        createdAt: now,
        updatedAt: now,
    }

    await users.insertOne(newUser)

    console.log('Platform owner criado com sucesso.')
    console.log(`Email: ${email}`)
    if (!tenantId) {
        console.log('tenantId: vazio (usuario global)')
    }
}

main()
    .catch((error) => {
        console.error('Falha ao executar seed do platform owner:')
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
