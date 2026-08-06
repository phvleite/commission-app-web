export function getClientTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
    } catch {
        return 'America/Sao_Paulo'
    }
}

export function withTimeZoneHeader(init?: RequestInit): RequestInit {
    const currentHeaders = new Headers(init?.headers ?? {})
    if (!currentHeaders.has('x-user-timezone')) {
        currentHeaders.set('x-user-timezone', getClientTimeZone())
    }

    return {
        ...init,
        headers: currentHeaders,
    }
}
