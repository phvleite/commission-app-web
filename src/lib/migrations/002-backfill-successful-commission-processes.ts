/**
 * Migração 002 — Marca como concluídas as vendas históricas criadas antes do
 * controle de processamento de comissões.
 *
 * Idempotente: cria CommissionProcess somente para vendas sem processo.
 * A data de corte é exclusiva e obrigatória para evitar classificar operações
 * recentes como históricas.
 *
 * Uso:
 *   npx tsx src/lib/migrations/002-backfill-successful-commission-processes.ts --before=2026-09-17
 *   npx tsx src/lib/migrations/002-backfill-successful-commission-processes.ts --before=2026-09-17 --apply
 */

import mongoose from 'mongoose'
import { withMigrationDatabase } from '@/lib/migrations/withMigrationDatabase'

const MIGRATION_ID = '002-backfill-successful-commission-processes'

interface HistoricalSale {
    _id: mongoose.Types.ObjectId
    tenantId: mongoose.Types.ObjectId
    date: Date
    value: number
    createdAt?: Date
    updatedAt?: Date
}

function parseExclusiveCutoff(args: string[]): Date {
    const raw = args.find((arg) => arg.startsWith('--before='))?.slice('--before='.length)

    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        throw new Error('Informe a data de corte no formato --before=AAAA-MM-DD.')
    }

    const cutoff = new Date(`${raw}T00:00:00.000Z`)
    if (Number.isNaN(cutoff.getTime())) {
        throw new Error('Data de corte invalida.')
    }

    return cutoff
}

export async function findHistoricalSalesWithoutProcess(
    salesCollection: mongoose.mongo.Collection,
    processesCollection: mongoose.mongo.Collection,
    commissionsCollection: mongoose.mongo.Collection,
    sectorSnapshotsCollection: mongoose.mongo.Collection,
    cutoff: Date,
): Promise<HistoricalSale[]> {
    const sales = (await salesCollection
        .find({ date: { $lt: cutoff } })
        .sort({ date: 1 })
        .toArray()) as unknown as HistoricalSale[]

    if (sales.length === 0) return []

    const existingProcesses = await processesCollection
        .find(
            {
                $or: sales.map((sale) => ({ tenantId: sale.tenantId, date: sale.date })),
            },
            { projection: { tenantId: 1, date: 1 } },
        )
        .toArray()

    const processKeys = new Set(
        existingProcesses.map(
            (process) => `${String(process.tenantId)}:${(process.date as Date).toISOString()}`,
        ),
    )

    const salesWithoutProcess = sales.filter(
        (sale) => !processKeys.has(`${String(sale.tenantId)}:${sale.date.toISOString()}`),
    )

    const verifiedSales: HistoricalSale[] = []
    for (const sale of salesWithoutProcess) {
        const key = { tenantId: sale.tenantId, date: sale.date }
        const [commissionExists, sectorSnapshotExists] = await Promise.all([
            commissionsCollection.findOne(key, { projection: { _id: 1 } }),
            sectorSnapshotsCollection.findOne(key, { projection: { _id: 1 } }),
        ])

        if (commissionExists || sectorSnapshotExists) {
            verifiedSales.push(sale)
        }
    }

    return verifiedSales
}

async function run(dryRun: boolean, cutoff: Date) {
    await withMigrationDatabase(async (db) => {
        const sales = db.collection('sales')
        const processes = db.collection('commissionprocesses')
        const commissions = db.collection('commissions')
        const sectorSnapshots = db.collection('salecommissionsectors')
        const candidates = await findHistoricalSalesWithoutProcess(
            sales,
            processes,
            commissions,
            sectorSnapshots,
            cutoff,
        )

        console.log(`[${MIGRATION_ID}] Data de corte exclusiva: ${cutoff.toISOString()}`)
        console.log(
            `[${MIGRATION_ID}] Vendas historicas sem processo e com calculo comprovado: ${candidates.length}`,
        )

        for (const sale of candidates.slice(0, 20)) {
            console.log(
                `[${MIGRATION_ID}] ${dryRun ? '[dry-run] ' : ''}tenant=${sale.tenantId} data=${sale.date.toISOString()} valor=${sale.value}`,
            )
        }

        if (candidates.length > 20) {
            console.log(`[${MIGRATION_ID}] ... e mais ${candidates.length - 20} vendas.`)
        }

        if (dryRun || candidates.length === 0) {
            console.log(
                dryRun
                    ? `[${MIGRATION_ID}] Nenhuma alteracao aplicada. Revise a lista e rode novamente com --apply.`
                    : `[${MIGRATION_ID}] Nenhuma venda precisa de migracao.`,
            )
            return
        }

        const now = new Date()
        const result = await processes.bulkWrite(
            candidates.map((sale) => ({
                updateOne: {
                    filter: { tenantId: sale.tenantId, date: sale.date },
                    update: {
                        $setOnInsert: {
                            tenantId: sale.tenantId,
                            date: sale.date,
                            status: 'success',
                            startedAt: sale.createdAt ?? sale.date,
                            finishedAt: sale.updatedAt ?? sale.createdAt ?? now,
                            message: 'Processamento histórico confirmado pela migração 002.',
                            createdAt: sale.createdAt ?? now,
                            updatedAt: now,
                        },
                    },
                    upsert: true,
                },
            })),
            { ordered: false },
        )

        console.log(`[${MIGRATION_ID}] Concluido. ${result.upsertedCount} processos criados.`)
    })
}

if (require.main === module) {
    const dryRun = !process.argv.includes('--apply')
    const cutoff = parseExclusiveCutoff(process.argv.slice(2))

    run(dryRun, cutoff).catch((error: unknown) => {
        console.error(`[${MIGRATION_ID}] Erro:`, error)
        process.exit(1)
    })
}
