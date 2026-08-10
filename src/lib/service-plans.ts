export const ABRASEL_DISCOUNT_PERCENTAGE = 5

export const DEFAULT_SERVICE_PLAN_CODE = 'plan_20' as const

export const SERVICE_PLAN_ORDER = ['plan_20', 'plan_50', 'plan_100', 'plan_100_plus'] as const

export type ServicePlanCode = (typeof SERVICE_PLAN_ORDER)[number]

export interface ServicePlanDefinition {
    code: ServicePlanCode
    name: string
    maxEmployees: number | null
    maxUsers: number
    monthlyPriceCents: number
}

export const SERVICE_PLANS: Record<ServicePlanCode, ServicePlanDefinition> = {
    plan_20: {
        code: 'plan_20',
        name: 'Ate 20 colaboradores',
        maxEmployees: 20,
        maxUsers: 4,
        monthlyPriceCents: 15000,
    },
    plan_50: {
        code: 'plan_50',
        name: 'Ate 50 colaboradores',
        maxEmployees: 50,
        maxUsers: 5,
        monthlyPriceCents: 22500,
    },
    plan_100: {
        code: 'plan_100',
        name: 'Ate 100 colaboradores',
        maxEmployees: 100,
        maxUsers: 6,
        monthlyPriceCents: 30000,
    },
    plan_100_plus: {
        code: 'plan_100_plus',
        name: 'Mais de 100 colaboradores',
        maxEmployees: null,
        maxUsers: 8,
        monthlyPriceCents: 37500,
    },
}

export function isServicePlanCode(value: string): value is ServicePlanCode {
    return SERVICE_PLAN_ORDER.includes(value as ServicePlanCode)
}

export function getServicePlan(code: ServicePlanCode): ServicePlanDefinition {
    return SERVICE_PLANS[code]
}

export function listServicePlans(): ServicePlanDefinition[] {
    return SERVICE_PLAN_ORDER.map((code) => SERVICE_PLANS[code])
}
