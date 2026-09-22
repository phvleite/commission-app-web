import type { Types } from 'mongoose'
import { SituationType } from '@/models/SituationType'

/** Tipos de situação criados automaticamente para cada novo tenant. */
export const DEFAULT_SITUATION_TYPES = ['Atestado', 'Falta', 'Férias', 'Folga', 'Suspensão']

function normalizeDescription(value: string): string {
    return value.trim().toLocaleLowerCase('pt-BR')
}

/**
 * Cria os tipos padrão que ainda não existem no tenant.
 * Idempotente: pode ser executado quantas vezes for necessário.
 */
export async function seedSituationTypesForTenant(
    tenantId: string | Types.ObjectId,
): Promise<number> {
    const existing = await SituationType.find({ tenantId }).select('description').lean()
    const existingDescriptions = new Set(
        existing.map((type) => normalizeDescription(type.description)),
    )

    const missing = DEFAULT_SITUATION_TYPES.filter(
        (description) => !existingDescriptions.has(normalizeDescription(description)),
    )

    let created = 0

    for (const description of missing) {
        // Upsert + índice único evitam duplicar em execuções simultâneas.
        const result = await SituationType.updateOne(
            { tenantId, description },
            { $setOnInsert: { active: true } },
            { upsert: true },
        )

        if (result.upsertedCount > 0) {
            created += 1
        }
    }

    return created
}
