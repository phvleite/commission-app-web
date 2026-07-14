import { Sector } from '@/models/Sector'

export interface SectorPercentageValidationResult {
    valid: boolean
    total: number
}

export async function ensureMeritocraciaSector(tenantId: string): Promise<void> {
    const existing = await Sector.findOne({
        tenantId,
        isMeritocracia: true,
    })
        .select('_id')
        .lean()

    if (existing) {
        return
    }

    try {
        await Sector.create({
            tenantId,
            name: 'MERITOCRACIA',
            percentage: 0,
            active: true,
            isMeritocracia: true,
        })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return
        }

        throw error
    }
}

export async function validateActiveSectorsPercentage(
    tenantId: string,
): Promise<SectorPercentageValidationResult> {
    const sectors = await Sector.find({
        tenantId,
        active: true,
        isMeritocracia: { $ne: true },
    })
        .select('percentage')
        .lean()

    const total = sectors.reduce((sum, sector) => sum + Number(sector.percentage ?? 0), 0)
    const normalizedTotal = Math.round(total * 100) / 100

    return {
        valid: normalizedTotal === 100,
        total: normalizedTotal,
    }
}

export function sectorPercentageBlockedResponse(total: number) {
    return Response.json(
        {
            error: `Operacao bloqueada. A soma dos percentuais dos setores ativos deve ser 100%. Total atual: ${total}%.`,
        },
        { status: 409 },
    )
}
