import { getSituationsForDate } from './getSituationsForDate'

export async function isEmployeeEligible(
    tenantId: string,
    employeeId: string,
    date: string
) {
    const situations = await getSituationsForDate(tenantId, employeeId, date)

    // Se houver qualquer situação ativa no dia → não elegível
    return situations.length === 0
}
