import {
    ABRASEL_DISCOUNT_PERCENTAGE,
    DEFAULT_SERVICE_PLAN_CODE,
    getServicePlan,
    isServicePlanCode,
    listServicePlans,
    SERVICE_PLAN_ORDER,
} from '@/lib/service-plans'

describe('service plan catalog', () => {
    it('keeps the expected default plan and plan order', () => {
        expect(DEFAULT_SERVICE_PLAN_CODE).toBe('plan_20')
        expect(SERVICE_PLAN_ORDER).toEqual(['plan_20', 'plan_50', 'plan_100', 'plan_100_plus'])
    })

    it('defines all configured plans with correct limits and prices', () => {
        expect(listServicePlans()).toEqual([
            {
                code: 'plan_20',
                name: 'Ate 20 colaboradores',
                maxEmployees: 20,
                maxUsers: 4,
                monthlyPriceCents: 15000,
            },
            {
                code: 'plan_50',
                name: 'Ate 50 colaboradores',
                maxEmployees: 50,
                maxUsers: 5,
                monthlyPriceCents: 22500,
            },
            {
                code: 'plan_100',
                name: 'Ate 100 colaboradores',
                maxEmployees: 100,
                maxUsers: 6,
                monthlyPriceCents: 30000,
            },
            {
                code: 'plan_100_plus',
                name: 'Mais de 100 colaboradores',
                maxEmployees: null,
                maxUsers: 8,
                monthlyPriceCents: 37500,
            },
        ])
    })

    it('resolves a specific plan by code', () => {
        expect(getServicePlan('plan_50')).toEqual({
            code: 'plan_50',
            name: 'Ate 50 colaboradores',
            maxEmployees: 50,
            maxUsers: 5,
            monthlyPriceCents: 22500,
        })
    })

    it('exposes the ABRASEL discount percentage', () => {
        expect(ABRASEL_DISCOUNT_PERCENTAGE).toBe(5)
    })

    it('validates service plan codes', () => {
        expect(isServicePlanCode('plan_20')).toBe(true)
        expect(isServicePlanCode('plan_100_plus')).toBe(true)
        expect(isServicePlanCode('plan_enterprise')).toBe(false)
    })
})
