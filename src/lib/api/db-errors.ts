export function isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    const name = (error as Error & { name?: string }).name?.toLowerCase() ?? ''
    const code = (error as Error & { code?: string }).code?.toString().toLowerCase() ?? ''

    return (
        name.includes('mongo') ||
        name.includes('mongoose') ||
        name.includes('network') ||
        message.includes('connection lost') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        code.includes('econn') ||
        code.includes('timedout')
    )
}
