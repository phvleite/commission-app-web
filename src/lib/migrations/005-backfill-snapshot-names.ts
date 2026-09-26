/**
 * Migração 005 — Grava o snapshot de nomes nos registros históricos.
 *
 * Preenche commissions.employeeName/sectorName, salecommissionsectors.sectorName
 * e employeesectorhistories.sectorName.
 *
 * Idempotente: só altera documentos em que o campo ainda está ausente.
 *
 * Uso:
 *   npm run migrate:snapshot-names
 *   npm run migrate:snapshot-names -- --apply
 */

import { withMigrationDatabase } from '@/lib/migrations/withMigrationDatabase'

const MIGRATION_ID = '005-backfill-snapshot-names'

const MISSING = { $in: [null, ''] }

async function run(dryRun: boolean) {
    await withMigrationDatabase(async (db) => {
        const employees = db.collection('employees')
        const sectors = db.collection('sectors')
        const commissions = db.collection('commissions')
        const saleCommissionSectors = db.collection('salecommissionsectors')
        const histories = db.collection('employeesectorhistories')

        const employeeNameById = new Map<string, string>()
        for (const employee of await employees.find({}, { projection: { name: 1 } }).toArray()) {
            employeeNameById.set(String(employee._id), String(employee.name))
        }

        const sectorNameById = new Map<string, string>()
        for (const sector of await sectors.find({}, { projection: { name: 1 } }).toArray()) {
            sectorNameById.set(String(sector._id), String(sector.name))
        }

        const pendingCommissions = await commissions
            .find(
                { $or: [{ employeeName: MISSING }, { sectorName: MISSING }] },
                { projection: { employeeId: 1, sectorId: 1, employeeName: 1, sectorName: 1 } },
            )
            .toArray()

        const pendingSectors = await saleCommissionSectors
            .find({ sectorName: MISSING }, { projection: { sectorId: 1 } })
            .toArray()

        const pendingHistories = await histories
            .find({ sectorName: MISSING }, { projection: { sectorId: 1 } })
            .toArray()

        console.log(
            `[${MIGRATION_ID}] Pendentes -> comissoes: ${pendingCommissions.length}, setores do dia: ${pendingSectors.length}, historicos: ${pendingHistories.length}`,
        )

        const orphans = new Set<string>()
        for (const commission of pendingCommissions) {
            if (!employeeNameById.has(String(commission.employeeId))) {
                orphans.add(`colaborador=${String(commission.employeeId)}`)
            }
            if (!sectorNameById.has(String(commission.sectorId))) {
                orphans.add(`setor=${String(commission.sectorId)}`)
            }
        }
        if (orphans.size > 0) {
            console.log(
                `[${MIGRATION_ID}] Referencias sem cadastro (serao ignoradas): ${[...orphans].join(', ')}`,
            )
        }

        const total = pendingCommissions.length + pendingSectors.length + pendingHistories.length
        if (dryRun || total === 0) {
            console.log(
                dryRun
                    ? `[${MIGRATION_ID}] Nenhuma alteracao aplicada. Rode novamente com --apply.`
                    : `[${MIGRATION_ID}] Nenhum registro precisa de migracao.`,
            )
            return
        }

        let updated = 0

        const commissionOps = pendingCommissions.flatMap((commission) => {
            const fields: Record<string, string> = {}
            const employeeName = employeeNameById.get(String(commission.employeeId))
            const sectorName = sectorNameById.get(String(commission.sectorId))

            if (!commission.employeeName && employeeName) fields.employeeName = employeeName
            if (!commission.sectorName && sectorName) fields.sectorName = sectorName
            if (Object.keys(fields).length === 0) return []

            return [{ updateOne: { filter: { _id: commission._id }, update: { $set: fields } } }]
        })

        if (commissionOps.length > 0) {
            const result = await commissions.bulkWrite(commissionOps, { ordered: false })
            updated += result.modifiedCount
        }

        for (const [collection, pending] of [
            [saleCommissionSectors, pendingSectors],
            [histories, pendingHistories],
        ] as const) {
            const ops = pending.flatMap((doc) => {
                const sectorName = sectorNameById.get(String(doc.sectorId))
                if (!sectorName) return []
                return [
                    { updateOne: { filter: { _id: doc._id }, update: { $set: { sectorName } } } },
                ]
            })

            if (ops.length > 0) {
                const result = await collection.bulkWrite(ops, { ordered: false })
                updated += result.modifiedCount
            }
        }

        console.log(`[${MIGRATION_ID}] Concluido. ${updated} documentos atualizados.`)
    })
}

if (require.main === module) {
    run(!process.argv.includes('--apply')).catch((error: unknown) => {
        console.error(`[${MIGRATION_ID}] Erro:`, error)
        process.exit(1)
    })
}
