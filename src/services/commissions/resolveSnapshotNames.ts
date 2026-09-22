import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'

interface ResolveInput {
    employeeIds: string[]
    sectorIds: string[]
}

interface ResolvedNames {
    employeeNameById: Map<string, string>
    sectorNameById: Map<string, string>
}

/**
 * Busca em lote os nomes de registros anteriores ao backfill de snapshots.
 * Evita o lookup por linha (N+1) nos relatórios de período.
 */
export async function resolveMissingSnapshotNames(input: ResolveInput): Promise<ResolvedNames> {
    const [employees, sectors] = await Promise.all([
        input.employeeIds.length
            ? Employee.find({ _id: { $in: input.employeeIds } })
                  .select('name')
                  .lean()
            : Promise.resolve([]),
        input.sectorIds.length
            ? Sector.find({ _id: { $in: input.sectorIds } })
                  .select('name')
                  .lean()
            : Promise.resolve([]),
    ])

    return {
        employeeNameById: new Map(employees.map((item) => [String(item._id), item.name])),
        sectorNameById: new Map(sectors.map((item) => [String(item._id), item.name])),
    }
}

export function collectMissingIds<T>(
    items: T[],
    hasName: (item: T) => boolean,
    getId: (item: T) => unknown,
): string[] {
    const ids = new Set<string>()

    for (const item of items) {
        if (!hasName(item)) {
            ids.add(String(getId(item)))
        }
    }

    return [...ids]
}
