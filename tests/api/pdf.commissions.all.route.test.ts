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

jest.mock('@/models/MeritocracyAllocation', () => ({
    MeritocracyAllocation: {
        find: jest.fn(),
    },
}))

import { auth } from '@/auth'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { POST } from '@/app/api/pdf/commissions/all/route'
import { PDFDocument } from 'pdf-lib'

const authMock = auth as unknown as jest.Mock
const findAllocationsMock = MeritocracyAllocation.find as unknown as jest.Mock

const validPayload = {
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    data: [{ employeeName: 'Alice', sectorName: 'Vendas', employeeValue: 500 }],
    sectorSummary: [{ sectorName: 'Vendas', sectorValue: 500 }],
    salesSummary: [{ value: 10000, totalCommissionValue: 500 }],
    situations: [],
    meritocracyTotal: 0,
}

function configureAllocationQuery(totalMeritocracyValue = 250) {
    const query = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ totalMeritocracyValue }]),
    }
    findAllocationsMock.mockReturnValue(query)
    return query
}

describe('API pdf/commissions/all route', () => {
    beforeEach(() => {
        authMock.mockReset()
        findAllocationsMock.mockReset()
    })

    it('returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null)

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(response.status).toBe(401)
    })

    it('rejects malformed report rows', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...validPayload, data: [{ employeeName: 'Alice' }] }),
            }),
        )

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toEqual({
            error: 'Payload inválido para geração de PDF.',
        })
    })

    it('returns PDF and recalculates meritocracy for the authenticated tenant and period', async () => {
        authMock.mockResolvedValue({
            user: { id: 'u1', tenantId: 'tenant-1', tenantTimeZone: 'UTC' },
        })
        configureAllocationQuery()

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...validPayload, meritocracyTotal: 999999 }),
            }),
        )

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('application/pdf')
        expect(response.headers.get('Content-Disposition')).toMatch(
            /^attachment; filename="relatorio-geral-/,
        )
        const pdf = await PDFDocument.load(new Uint8Array(await response.arrayBuffer()))
        expect(pdf.getPageCount()).toBe(1)
        expect(pdf.getTitle()).toBe('GORJETAS REF. JULHO/2026')
        expect(pdf.getAuthor()).toBe('Empresa Exemplo')
        expect(findAllocationsMock).toHaveBeenCalledWith({
            tenantId: 'tenant-1',
            status: 'success',
            paymentDate: {
                $gte: new Date('2026-07-01T00:00:00.000Z'),
                $lte: new Date('2026-07-31T23:59:59.999Z'),
            },
        })
    })
})
