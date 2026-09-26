/**
 * Migração 003 — Cria o primeiro histórico setorial dos colaboradores legados.
 *
 * Idempotente: só inclui colaboradores que ainda não possuem histórico.
 *
 * Uso:
 *   npm run migrate:employee-sector-history
 *   npm run migrate:employee-sector-history -- --apply
 */

import { withMigrationDatabase } from '@/lib/migrations/withMigrationDatabase'

const MIGRATION_ID = '003-backfill-employee-sector-history'

async function run(dryRun: boolean) {
    await withMigrationDatabase(async (db) => {
        const employees = db.collection('employees')
        const histories = db.collection('employeesectorhistories')
        const allEmployees = await employees.find({}).sort({ tenantId: 1, name: 1 }).toArray()
        const candidates = []

        for (const employee of allEmployees) {
            const exists = await histories.findOne(
                { tenantId: employee.tenantId, employeeId: employee._id },
                { projection: { _id: 1 } },
            )
            if (!exists) candidates.push(employee)
        }

        console.log(`[${MIGRATION_ID}] Colaboradores sem historico: ${candidates.length}`)
        for (const employee of candidates.slice(0, 20)) {
            console.log(
                `[${MIGRATION_ID}] ${dryRun ? '[dry-run] ' : ''}tenant=${employee.tenantId} colaborador=${employee.name} inicio=${employee.admissionDate?.toISOString()}`,
            )
        }
        if (candidates.length > 20) {
            console.log(`[${MIGRATION_ID}] ... e mais ${candidates.length - 20} colaboradores.`)
        }

        if (dryRun || candidates.length === 0) {
            console.log(
                dryRun
                    ? `[${MIGRATION_ID}] Nenhuma alteracao aplicada. Rode novamente com --apply.`
                    : `[${MIGRATION_ID}] Nenhum colaborador precisa de migracao.`,
            )
            return
        }

        const now = new Date()
        const result = await histories.bulkWrite(
            candidates.map((employee) => ({
                updateOne: {
                    filter: { tenantId: employee.tenantId, employeeId: employee._id },
                    update: {
                        $setOnInsert: {
                            tenantId: employee.tenantId,
                            employeeId: employee._id,
                            sectorId: employee.sectorId,
                            startDate: employee.admissionDate,
                            ...(employee.dismissalDate ? { endDate: employee.dismissalDate } : {}),
                            createdAt: employee.createdAt ?? now,
                            updatedAt: now,
                        },
                    },
                    upsert: true,
                },
            })),
            { ordered: false },
        )

        console.log(`[${MIGRATION_ID}] Concluido. ${result.upsertedCount} historicos criados.`)
    })
}

if (require.main === module) {
    run(!process.argv.includes('--apply')).catch((error: unknown) => {
        console.error(`[${MIGRATION_ID}] Erro:`, error)
        process.exit(1)
    })
}
