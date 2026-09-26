import { Types } from 'mongoose'
import { clearTestDB, connectTestDB, disconnectTestDB } from '@/lib/test-db'
import { SituationType } from '@/models/SituationType'
import {
    DEFAULT_SITUATION_TYPES,
    seedSituationTypesForTenant,
} from '@/services/situations/seedSituationTypes'

async function listDescriptions(tenantId: Types.ObjectId): Promise<string[]> {
    const types = await SituationType.find({ tenantId }).select('description').lean()
    return types.map((type) => type.description).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

describe('seedSituationTypesForTenant', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('creates the default types for a new tenant', async () => {
        const tenantId = new Types.ObjectId()

        const created = await seedSituationTypesForTenant(tenantId)

        expect(created).toBe(DEFAULT_SITUATION_TYPES.length)
        expect(await listDescriptions(tenantId)).toEqual(
            [...DEFAULT_SITUATION_TYPES].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        )
    })

    it('marks the created types as active', async () => {
        const tenantId = new Types.ObjectId()

        await seedSituationTypesForTenant(tenantId)

        const types = await SituationType.find({ tenantId }).select('active').lean()
        expect(types).toHaveLength(DEFAULT_SITUATION_TYPES.length)
        expect(types.every((type) => type.active)).toBe(true)
    })

    it('is idempotent across repeated runs', async () => {
        const tenantId = new Types.ObjectId()

        await seedSituationTypesForTenant(tenantId)
        const secondRun = await seedSituationTypesForTenant(tenantId)

        expect(secondRun).toBe(0)
        expect(await listDescriptions(tenantId)).toHaveLength(DEFAULT_SITUATION_TYPES.length)
    })

    it('does not duplicate a type already registered with different casing', async () => {
        const tenantId = new Types.ObjectId()
        await SituationType.create({ tenantId, description: 'férias', active: true })

        const created = await seedSituationTypesForTenant(tenantId)

        expect(created).toBe(DEFAULT_SITUATION_TYPES.length - 1)
        const descriptions = await listDescriptions(tenantId)
        expect(descriptions).toContain('férias')
        expect(descriptions).not.toContain('Férias')
    })

    it('keeps custom types created by the tenant', async () => {
        const tenantId = new Types.ObjectId()
        await SituationType.create({ tenantId, description: 'Treinamento', active: true })

        await seedSituationTypesForTenant(tenantId)

        expect(await listDescriptions(tenantId)).toContain('Treinamento')
    })

    it('scopes the seed to the informed tenant', async () => {
        const tenantId = new Types.ObjectId()
        const otherTenantId = new Types.ObjectId()

        await seedSituationTypesForTenant(tenantId)

        expect(await listDescriptions(otherTenantId)).toEqual([])
    })
})
