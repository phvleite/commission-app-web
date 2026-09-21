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

jest.mock('puppeteer', () => ({
    __esModule: true,
    default: {
        launch: jest.fn(),
    },
}))

import { auth } from '@/auth'
import puppeteer from 'puppeteer'
import { POST } from '@/app/api/pdf/meritocracy/route'

const authMock = auth as unknown as jest.Mock
const launchMock = puppeteer.launch as unknown as jest.Mock

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
        launchMock.mockReset()
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

    it('returns a PDF when payload is valid', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const setContentMock = jest.fn().mockResolvedValue(undefined)
        const pdfMock = jest.fn().mockResolvedValue(Buffer.from('fake-pdf'))
        const pageCloseMock = jest.fn().mockResolvedValue(undefined)
        const browserCloseMock = jest.fn().mockResolvedValue(undefined)

        launchMock.mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
                setContent: setContentMock,
                pdf: pdfMock,
                close: pageCloseMock,
            }),
            close: browserCloseMock,
        })

        const res = await POST(
            new Request('http://localhost/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(res.status).toBe(200)
        expect(res.headers.get('Content-Type')).toBe('application/pdf')
        expect(setContentMock).toHaveBeenCalled()
        expect(pdfMock).toHaveBeenCalled()
        expect(pageCloseMock).toHaveBeenCalled()
        expect(browserCloseMock).toHaveBeenCalled()
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
