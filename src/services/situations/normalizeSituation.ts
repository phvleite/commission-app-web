interface NormalizableSituation {
    _id: unknown
    employeeId: unknown
    typeId: unknown
    startDate: string | Date
    endDate: string | Date
    active?: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>
    }
    return null
}

export function normalizeSituation(s: NormalizableSituation) {
    const employeeRef = asRecord(s.employeeId)
    const typeRef = asRecord(s.typeId)
    const employeeName = employeeRef?.name
    const typeDescription = typeRef?.description

    return {
        _id: String(s._id),
        employeeId: String(employeeRef?._id ?? s.employeeId),
        employeeName: typeof employeeName === 'string' ? employeeName : '',

        typeId: String(typeRef?._id ?? s.typeId),
        typeDescription: typeof typeDescription === 'string' ? typeDescription : '',

        startDate: new Date(s.startDate).toISOString().substring(0, 10),
        endDate: new Date(s.endDate).toISOString().substring(0, 10),

        active: Boolean(s.active),
    }
}
