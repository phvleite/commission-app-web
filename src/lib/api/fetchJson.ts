export async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const contentType = response.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
        const body = await response.text()

        if (body.includes('<!DOCTYPE') || body.includes('<html')) {
            throw new Error('Sessão expirada. Faça login novamente.')
        }

        throw new Error(fallbackMessage)
    }

    try {
        return (await response.json()) as T
    } catch {
        throw new Error(fallbackMessage)
    }
}
