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
import { POST } from '@/app/api/pdf/meritocracy/route'
import { PDFDocument } from 'pdf-lib'

const authMock = auth as unknown as jest.Mock

const validPayload = {
    competence: '2027-05',
    paymentDate: '2027-05-31T00:00:00.000Z',
    totalMeritocracyValue: 1000,
    recipientCount: 1,
    status: 'success',
    cancelReason: null,
    recipients: [
        {
            employeeId: 'emp-1',
            employeeName: 'Alice',
            sectorId: 'sec-a',
            sectorName: 'Setor A',
            employeeValue: 1000,
        },
    ],
}

describe('API pdf/meritocracy route', () => {
    beforeEach(() => {
        authMock.mockReset()
    })

    it('returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null)

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(res.status).toBe(401)
    })

    it('returns 400 for invalid payload', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
        )

        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ error: 'Payload inválido.' })
    })

    it('returns a valid PDF with company metadata when payload is valid', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(res.status).toBe(200)
        expect(res.headers.get('Content-Type')).toBe('application/pdf')
        expect(res.headers.get('Content-Disposition')).toBe(
            'inline; filename="relatorio-meritocracia.pdf"',
        )
        const pdf = await PDFDocument.load(new Uint8Array(await res.arrayBuffer()))
        expect(pdf.getPageCount()).toBe(1)
        expect(pdf.getTitle()).toContain('Maio/2027')
        expect(pdf.getAuthor()).toBe('Empresa Exemplo')
    })

    it('returns 400 when recipients do not match the declared total', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...validPayload,
                    totalMeritocracyValue: 1500,
                }),
            }),
        )

        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ error: 'Payload inválido.' })
    })

    it('returns 404 when tenant is not found', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const { Tenant } = jest.requireMock('@/models/Tenant') as {
            Tenant: { findById: jest.Mock }
        }
        Tenant.findById.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        })

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(res.status).toBe(404)
    })
})
