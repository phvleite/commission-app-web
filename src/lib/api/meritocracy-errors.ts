import { MeritocracyAllocationError } from '@/services/meritocracy/generateMeritocracyAllocation'

const STATUS_BY_CODE: Record<string, number> = {
    INVALID_COMPETENCE: 400,
    NO_RECIPIENTS_SELECTED: 400,
    INELIGIBLE_EMPLOYEES: 400,
    NO_ELIGIBLE_RECIPIENTS: 400,
    CANCEL_REASON_REQUIRED: 400,
    MERITOCRACY_SECTOR_NOT_FOUND: 409,
    NO_MERITOCRACY_VALUE: 409,
    COMPETENCE_ALREADY_LAUNCHED: 409,
    ALLOCATION_ALREADY_CANCELLED: 409,
    ALLOCATION_NOT_FOUND: 404,
}

export function meritocracyErrorResponse(error: MeritocracyAllocationError): Response {
    const status = STATUS_BY_CODE[error.code] ?? 400

    return Response.json(
        { error: error.message, errorCode: error.code, details: error.details },
        { status },
    )
}
