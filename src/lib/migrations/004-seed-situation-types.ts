/**
 * Migração 004 — Cria os tipos de situação padrão nos tenants existentes.
 *
 * Idempotente: só insere os tipos que ainda não existem em cada tenant.
 *
 * Uso:
 *   npm run migrate:situation-types
 *   npm run migrate:situation-types -- --apply
 */

import { withMigrationDatabase } from '@/lib/migrations/withMigrationDatabase'

const MIGRATION_ID = '004-seed-situation-types'

const DEFAULT_SITUATION_TYPES = ['Atestado', 'Falta', 'Férias', 'Folga', 'Suspensão']

function normalizeDescription(value: string): string {
    return value.trim().toLocaleLowerCase('pt-BR')
}

async function run(dryRun: boolean) {
    await withMigrationDatabase(async (db) => {
        const tenants = db.collection('tenants')
        const situationTypes = db.collection('situationtypes')

        const allTenants = await tenants.find({}).sort({ name: 1 }).toArray()
        const candidates: Array<{ tenantId: unknown; name: string; missing: string[] }> = []

        for (const tenant of allTenants) {
            const existing = await situationTypes
                .find({ tenantId: tenant._id }, { projection: { description: 1 } })
                .toArray()

            const existingDescriptions = new Set(
                existing.map((type) => normalizeDescription(String(type.description))),
            )

            const missing = DEFAULT_SITUATION_TYPES.filter(
                (description) => !existingDescriptions.has(normalizeDescription(description)),
            )

            if (missing.length > 0) {
                candidates.push({ tenantId: tenant._id, name: String(tenant.name), missing })
            }
        }

        const totalMissing = candidates.reduce((total, item) => total + item.missing.length, 0)
        console.log(
            `[${MIGRATION_ID}] Tenants a ajustar: ${candidates.length} (${totalMissing} tipos).`,
        )

        for (const candidate of candidates.slice(0, 20)) {
            console.log(
                `[${MIGRATION_ID}] ${dryRun ? '[dry-run] ' : ''}tenant=${candidate.name} tipos=${candidate.missing.join(', ')}`,
            )
        }
        if (candidates.length > 20) {
            console.log(`[${MIGRATION_ID}] ... e mais ${candidates.length - 20} tenants.`)
        }

        if (dryRun || candidates.length === 0) {
            console.log(
                dryRun
                    ? `[${MIGRATION_ID}] Nenhuma alteracao aplicada. Rode novamente com --apply.`
                    : `[${MIGRATION_ID}] Nenhum tenant precisa de migracao.`,
            )
            return
        }

        const now = new Date()
        const result = await situationTypes.bulkWrite(
            candidates.flatMap((candidate) =>
                candidate.missing.map((description) => ({
                    updateOne: {
                        filter: { tenantId: candidate.tenantId, description },
                        update: {
                            $setOnInsert: {
                                tenantId: candidate.tenantId,
                                description,
                                active: true,
                                createdAt: now,
                                updatedAt: now,
                            },
                        },
                        upsert: true,
                    },
                })),
            ),
            { ordered: false },
        )

        console.log(`[${MIGRATION_ID}] Concluido. ${result.upsertedCount} tipos criados.`)
    })
}

if (require.main === module) {
    run(!process.argv.includes('--apply')).catch((error: unknown) => {
        console.error(`[${MIGRATION_ID}] Erro:`, error)
        process.exit(1)
    })
}
