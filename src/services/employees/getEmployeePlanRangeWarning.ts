import { getResolvedServicePlan } from '@/lib/service-plans'
import { Employee } from '@/models/Employee'
import { Tenant } from '@/models/Tenant'

export async function getEmployeePlanRangeWarning(tenantId: string): Promise<string | undefined> {
    const tenant = await Tenant.findById(tenantId).select('planCode').lean()
    const plan = getResolvedServicePlan(tenant?.planCode)

    if (plan.maxEmployees === null) {
        return undefined
    }

    const activeEmployees = await Employee.countDocuments({ tenantId, active: true })

    if (activeEmployees <= plan.maxEmployees) {
        return undefined
    }

    return `Sua empresa possui ${activeEmployees} colaboradores ativos e ultrapassou a faixa de até ${plan.maxEmployees} colaboradores do plano atual. Revise seu plano.`
}
