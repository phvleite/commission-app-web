import { Commission } from '@/models/Commission'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'

export interface ExpectedSectorSnapshot {
    sectorId: string
    appliedPercentage: number
    totalSectorValue: number
    totalEmployees: number
    eligibleEmployees: number
}

export interface ExpectedCommissionSnapshot {
    employeeId: string
    sectorId: string
    situation: string
    sectorValue: number
    employeeValue: number
    eligibleCount: number
    totalCount: number
}

function valuesMatch(
    actual: Record<string, unknown>,
    expected: Record<string, string | number>,
): boolean {
    return Object.entries(expected).every(([key, value]) => String(actual[key]) === String(value))
}

export async function validateCommissionGeneration(
    tenantId: string,
    date: Date,
    expectedSectors: ExpectedSectorSnapshot[],
    expectedCommissions: ExpectedCommissionSnapshot[],
): Promise<void> {
    const [persistedSectors, persistedCommissions] = await Promise.all([
        SaleCommissionSector.find({ tenantId, date }).lean(),
        Commission.find({ tenantId, date }).lean(),
    ])

    if (persistedSectors.length !== expectedSectors.length) {
        throw new Error(
            `Validação das comissões falhou: esperados ${expectedSectors.length} setores, encontrados ${persistedSectors.length}.`,
        )
    }

    if (persistedCommissions.length !== expectedCommissions.length) {
        throw new Error(
            `Validação das comissões falhou: esperadas ${expectedCommissions.length} comissões, encontradas ${persistedCommissions.length}.`,
        )
    }

    for (const expected of expectedSectors) {
        const actual = persistedSectors.find(
            (sector) => String(sector.sectorId) === expected.sectorId,
        ) as Record<string, unknown> | undefined

        if (
            !actual ||
            !valuesMatch(actual, {
                appliedPercentage: expected.appliedPercentage,
                totalSectorValue: expected.totalSectorValue,
                totalEmployees: expected.totalEmployees,
                eligibleEmployees: expected.eligibleEmployees,
            })
        ) {
            throw new Error(`Validação das comissões falhou para o setor ${expected.sectorId}.`)
        }
    }

    for (const expected of expectedCommissions) {
        const actual = persistedCommissions.find(
            (commission) => String(commission.employeeId) === expected.employeeId,
        ) as Record<string, unknown> | undefined

        if (
            !actual ||
            String(actual.sectorId) !== expected.sectorId ||
            !valuesMatch(actual, {
                situation: expected.situation,
                sectorValue: expected.sectorValue,
                employeeValue: expected.employeeValue,
                eligibleCount: expected.eligibleCount,
                totalCount: expected.totalCount,
            })
        ) {
            throw new Error(
                `Validação das comissões falhou para o colaborador ${expected.employeeId}.`,
            )
        }
    }
}
