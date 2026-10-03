jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
    connectDB: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/models/Tenant', () => ({
    Tenant: {
        findById: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ name: 'Empresa Exemplo' }),
        })),
    },
}))

import { auth } from '@/auth'
import { PDFDocument } from 'pdf-lib'
import { Tenant } from '@/models/Tenant'
import { POST } from '@/app/api/pdf/situations/route'

const authMock = auth as unknown as jest.Mock

describe('API pdf/situations route', () => {
    beforeEach(() => {
        authMock.mockReset()
    })

    it('returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null)

        const res = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ situations: [] }),
            }),
        )

        expect(res.status).toBe(401)
    })

    it('returns 400 for invalid payload', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
        )

        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ error: 'Payload inválido.' })
    })

    it('returns a PDF when payload is valid', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Relatorio de Situacoes',
                    situations: [
                        {
                            employeeName: 'Alice',
                            typeDescription: 'Ferias',
                            startDate: '2026-07-01',
                            endDate: '2026-07-05',
                            active: true,
                        },
                    ],
                }),
            }),
        )

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toBe('application/pdf')
        expect(res.headers.get('content-disposition')).toContain('relatorio-situacoes.pdf')
        const bytes = await res.arrayBuffer()
        expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
        const document = await PDFDocument.load(bytes)
        expect(document.getPageCount()).toBe(1)
        expect(document.getTitle()).toBe('Relatorio de Situacoes')
        expect(document.getAuthor()).toBe('Empresa Exemplo')
    })

    it('rejects malformed rows instead of failing during rendering', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })
        const response = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ situations: [{ employeeName: 123 }] }),
            }),
        )
        expect(response.status).toBe(400)
    })

    it('returns 404 when the session company does not exist', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })
        const tenantMock = Tenant.findById as jest.Mock
        tenantMock.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        })
        const response = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ situations: [] }),
            }),
        )
        expect(response.status).toBe(404)
        expect(tenantMock).toHaveBeenCalledWith('tenant-1')
    })
})
