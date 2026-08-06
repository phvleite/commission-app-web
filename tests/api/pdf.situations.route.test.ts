jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('puppeteer', () => ({
    __esModule: true,
    default: {
        launch: jest.fn(),
    },
}))

import { auth } from '@/auth'
import puppeteer from 'puppeteer'
import { POST } from '@/app/api/pdf/situations/route'

const authMock = auth as unknown as jest.Mock
const launchMock = puppeteer.launch as unknown as jest.Mock

describe('API pdf/situations route', () => {
    beforeEach(() => {
        authMock.mockReset()
        launchMock.mockReset()
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
        authMock.mockResolvedValue({ user: { id: 'u1' } })

        const res = await POST(
            new Request('http://localhost/api/pdf/situations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
        )

        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ error: 'Payload invalido.' })
    })

    it('returns a PDF when payload is valid', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } })

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
        expect(setContentMock).toHaveBeenCalled()
        expect(pdfMock).toHaveBeenCalled()
        expect(pageCloseMock).toHaveBeenCalled()
        expect(browserCloseMock).toHaveBeenCalled()
    })
})
