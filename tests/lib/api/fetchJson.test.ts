import { readJsonResponse } from '@/lib/api/fetchJson'

describe('readJsonResponse', () => {
    it('returns parsed JSON payload when content type is application/json', async () => {
        const response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json; charset=utf-8' },
        })

        await expect(readJsonResponse<{ ok: boolean }>(response, 'fallback')).resolves.toEqual({
            ok: true,
        })
    })

    it('throws session expired error when response is HTML', async () => {
        const response = new Response('<!DOCTYPE html><html><body>login</body></html>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
        })

        await expect(readJsonResponse(response, 'fallback')).rejects.toThrow(
            'Sessão expirada. Faça login novamente.',
        )
    })

    it('throws fallback error for non-json non-html body', async () => {
        const response = new Response('plain text error', {
            status: 500,
            headers: { 'content-type': 'text/plain' },
        })

        await expect(readJsonResponse(response, 'Erro padrão')).rejects.toThrow('Erro padrão')
    })

    it('throws fallback error when json parsing fails', async () => {
        const response = new Response('not-json', {
            status: 200,
            headers: { 'content-type': 'application/json' },
        })

        await expect(readJsonResponse(response, 'Erro ao parsear')).rejects.toThrow(
            'Erro ao parsear',
        )
    })
})
