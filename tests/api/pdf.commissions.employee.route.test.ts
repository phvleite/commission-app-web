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
import { POST } from '@/app/api/pdf/commissions/employee/route'
import { PDFDocument } from 'pdf-lib'

const authMock = auth as unknown as jest.Mock
const findAllocationsMock = MeritocracyAllocation.find as unknown as jest.Mock

const validPayload = {
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    employeeId: 'employee-1',
    data: [
        {
            date: '2026-07-02T00:00:00.000Z',
            employeeName: 'Alice',
            sectorName: 'Vendas',
            situation: 'Apto',
            totalCount: 2,
            eligibleCount: 2,
            sectorValue: 500,
            employeeValue: 250,
        },
    ],
    sectorSummary: [{ sectorName: 'Vendas', sectorValue: 500, employeeValue: 250 }],
    meritocracyValue: 0,
    meritocracyEntries: [],
}

function configureAllocationQuery() {
    const query = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
            {
                paymentDate: new Date('2026-07-01T00:00:00.000Z'),
                recipients: [
                    {
                        employeeId: 'employee-1',
                        employeeName: 'Alice',
                        sectorId: 'sector-1',
                        sectorName: 'Vendas',
                        employeeValue: 150,
                    },
                    {
                        employeeId: 'employee-2',
                        employeeName: 'Bruno',
                        sectorId: 'sector-1',
                        sectorName: 'Vendas',
                        employeeValue: 100,
                    },
                ],
            },
        ]),
    }
    findAllocationsMock.mockReturnValue(query)
    return query
}

describe('API pdf/commissions/employee route', () => {
    beforeEach(() => {
        authMock.mockReset()
        findAllocationsMock.mockReset()
    })

    it('returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null)

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validPayload),
            }),
        )

        expect(response.status).toBe(401)
    })

    it('rejects malformed commission rows', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1', tenantId: 'tenant-1' } })

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...validPayload, data: [{ employeeValue: '250' }] }),
            }),
        )

        expect(response.status).toBe(400)
    })

    it('returns PDF and recalculates meritocracy for the employee and period', async () => {
        authMock.mockResolvedValue({
            user: { id: 'u1', tenantId: 'tenant-1', tenantTimeZone: 'UTC' },
        })
        configureAllocationQuery()

        const response = await POST(
            new Request('http://localhost/api/pdf/commissions/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...validPayload,
                    meritocracyValue: 999999,
                    meritocracyEntries: [],
                }),
            }),
        )

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('application/pdf')
        expect(response.headers.get('Content-Disposition')).toMatch(
            /^attachment; filename="relatorio-colaborador-/,
        )
        const pdf = await PDFDocument.load(new Uint8Array(await response.arrayBuffer()))
        expect(pdf.getPageCount()).toBe(1)
        expect(pdf.getTitle()).toBe('GORJETAS DE ALICE - REF. JULHO/2026')
        expect(pdf.getAuthor()).toBe('Empresa Exemplo')
        expect(findAllocationsMock).toHaveBeenCalledWith({
            tenantId: 'tenant-1',
            status: 'success',
            paymentDate: {
                $gte: new Date('2026-07-01T00:00:00.000Z'),
                $lte: new Date('2026-07-31T23:59:59.999Z'),
            },
            'recipients.employeeId': 'employee-1',
        })
    })
})
