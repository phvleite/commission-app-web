import { resolvePlanCodeFromMaxUsers } from '@/lib/migrations/001-backfill-tenant-plan'
import { getServicePlan } from '@/lib/service-plans'

describe('001-backfill-tenant-plan resolvePlanCodeFromMaxUsers', () => {
    it('retorna plan_20 para tenants sem maxUsers', () => {
        expect(resolvePlanCodeFromMaxUsers(undefined)).toBe('plan_20')
        expect(resolvePlanCodeFromMaxUsers(0)).toBe('plan_20')
    })

    it('retorna plan_20 para maxUsers dentro do limite do plano 20', () => {
        expect(resolvePlanCodeFromMaxUsers(1)).toBe('plan_20')
        expect(resolvePlanCodeFromMaxUsers(3)).toBe('plan_20')
        expect(resolvePlanCodeFromMaxUsers(4)).toBe('plan_20')
    })

    it('retorna plan_50 para maxUsers 5', () => {
        expect(resolvePlanCodeFromMaxUsers(5)).toBe('plan_50')
    })

    it('retorna plan_100 para maxUsers 6', () => {
        expect(resolvePlanCodeFromMaxUsers(6)).toBe('plan_100')
    })

    it('retorna plan_100_plus para maxUsers acima de 6', () => {
        expect(resolvePlanCodeFromMaxUsers(7)).toBe('plan_100_plus')
        expect(resolvePlanCodeFromMaxUsers(8)).toBe('plan_100_plus')
        expect(resolvePlanCodeFromMaxUsers(20)).toBe('plan_100_plus')
    })

    it('planCode inferido existe no catalogo de planos', () => {
        for (const maxUsers of [undefined, 1, 3, 4, 5, 6, 8]) {
            const code = resolvePlanCodeFromMaxUsers(maxUsers)
            expect(() => getServicePlan(code as Parameters<typeof getServicePlan>[0])).not.toThrow()
        }
    })

    it('maxUsers resultante do plano inferido e compativel com o maxUsers original', () => {
        const cases: Array<[number | undefined, number]> = [
            [undefined, 4],
            [3, 4],
            [4, 4],
            [5, 5],
            [6, 6],
            [8, 8],
        ]

        for (const [inputMaxUsers, expectedPlanMaxUsers] of cases) {
            const code = resolvePlanCodeFromMaxUsers(inputMaxUsers)
            const plan = getServicePlan(code as Parameters<typeof getServicePlan>[0])
            expect(plan.maxUsers).toBe(expectedPlanMaxUsers)
        }
    })
})
