/**
 * Migração 001 — Preenche planCode, billingStatus, discounts e maxUsers nos tenants
 * que foram criados antes desses campos existirem.
 *
 * Idempotente: só toca em tenants que ainda não têm planCode definido.
 *
 * Uso:
 *   npx tsx src/lib/migrations/001-backfill-tenant-plan.ts           (dry-run)
 *   npx tsx src/lib/migrations/001-backfill-tenant-plan.ts --apply   (aplica no banco)
 */

import mongoose from 'mongoose'
import { getServicePlan, type ServicePlanCode } from '@/lib/service-plans'

const MIGRATION_ID = '001-backfill-tenant-plan'

async function run(dryRun: boolean) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        throw new Error('MONGODB_URI nao definida.')
    }

    await mongoose.connect(uri)

    const db = mongoose.connection.db
    if (!db) {
        throw new Error('Conexao com o banco nao disponivel.')
    }

    const collection = db.collection('tenants')

    // Tenants sem planCode válido são candidatos à migração.
    const candidates = await collection
        .find({
            $or: [
                { planCode: { $exists: false } },
                { planCode: null },
                { planCode: { $nin: ['plan_20', 'plan_50', 'plan_100', 'plan_100_plus'] } },
            ],
        })
        .toArray()

    console.log(`[${MIGRATION_ID}] Candidatos encontrados: ${candidates.length}`)

    if (candidates.length === 0) {
        console.log(`[${MIGRATION_ID}] Nenhum tenant precisa de migracao.`)
        await mongoose.disconnect()
        return
    }

    let updated = 0

    for (const tenant of candidates) {
        // Tenta aproveitar maxUsers já gravado para inferir o plano mais próximo,
        // caso contrário cai no plano padrão.
        const existingMaxUsers =
            typeof tenant.maxUsers === 'number' && tenant.maxUsers > 0 ? tenant.maxUsers : undefined

        const planCode = resolvePlanCodeFromMaxUsers(existingMaxUsers)
        const plan = getServicePlan(planCode)

        const patch: Record<string, unknown> = {
            planCode,
            billingStatus: 'pending',
            discounts: [],
            maxUsers: plan.maxUsers,
        }

        if (dryRun) {
            console.log(
                `[${MIGRATION_ID}] [dry-run] tenant "${tenant.slug}" → planCode=${planCode}, maxUsers=${plan.maxUsers}, billingStatus=pending`,
            )
        } else {
            await collection.updateOne({ _id: tenant._id }, { $set: patch })
            console.log(
                `[${MIGRATION_ID}] Atualizado tenant "${tenant.slug}" → planCode=${planCode}, maxUsers=${plan.maxUsers}`,
            )
            updated++
        }
    }

    if (dryRun) {
        console.log(
            `[${MIGRATION_ID}] Dry-run concluido. ${candidates.length} tenants seriam atualizados. Rode com --apply para aplicar.`,
        )
    } else {
        console.log(`[${MIGRATION_ID}] Concluido. ${updated} tenants atualizados.`)
    }

    await mongoose.disconnect()
}

/**
 * Infere o planCode mais próximo baseado no maxUsers já gravado no tenant.
 * Usa plan_20 como fallback conservador.
 */
export function resolvePlanCodeFromMaxUsers(maxUsers?: number): ServicePlanCode {
    if (!maxUsers || maxUsers <= 4) return 'plan_20'
    if (maxUsers <= 5) return 'plan_50'
    if (maxUsers <= 6) return 'plan_100'
    return 'plan_100_plus'
}

// Executa apenas quando chamado diretamente via tsx/node, não em testes.
if (require.main === module) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config')
    const dryRun = !process.argv.includes('--apply')
    run(dryRun).catch((error: unknown) => {
        console.error(`[${MIGRATION_ID}] Erro:`, error)
        process.exit(1)
    })
}
