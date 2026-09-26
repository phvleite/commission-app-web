/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import DashboardLayout from '@/app/dashboard/layout'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { validateActiveSectorsPercentage } from '@/lib/api/business-rules'
import { Sector } from '@/models/Sector'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
    connectDB: jest.fn(),
}))

jest.mock('@/lib/api/business-rules', () => ({
    validateActiveSectorsPercentage: jest.fn(),
}))

jest.mock('@/models/Sector', () => ({
    Sector: { exists: jest.fn() },
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn((path: string) => {
        throw new Error(`redirect:${path}`)
    }),
    usePathname: () => '/dashboard',
}))

const authMock = auth as unknown as jest.Mock
const connectDBMock = connectDB as jest.MockedFunction<typeof connectDB>
const validateActiveSectorsPercentageMock = validateActiveSectorsPercentage as jest.MockedFunction<
    typeof validateActiveSectorsPercentage
>
const sectorExistsMock = Sector.exists as unknown as jest.Mock

function setSession() {
    authMock.mockResolvedValue({
        user: {
            id: 'user-id',
            tenantId: 'tenant-id',
            role: 'admin',
            email: 'admin@company.com',
            name: 'Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('DashboardLayout', () => {
    afterEach(() => {
        authMock.mockReset()
        connectDBMock.mockReset()
        validateActiveSectorsPercentageMock.mockReset()
        sectorExistsMock.mockReset()
    })

    it('renders an unavailable database state instead of crashing on Mongo network errors', async () => {
        setSession()
        connectDBMock.mockRejectedValueOnce(
            Object.assign(new Error('getaddrinfo ENOTFOUND ac-shard.mongodb.net'), {
                name: 'MongoServerSelectionError',
            }),
        )

        const element = await DashboardLayout({ children: <main>Dashboard content</main> })

        render(element)

        expect(screen.getByText('Banco de dados indisponível')).toBeInTheDocument()
        expect(
            screen.getByText(/Não foi possível conectar ao banco de dados agora/),
        ).toBeInTheDocument()
        expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument()
    })

    it('renders children when sector validation succeeds', async () => {
        setSession()
        connectDBMock.mockResolvedValueOnce({} as Awaited<ReturnType<typeof connectDB>>)
        validateActiveSectorsPercentageMock.mockResolvedValueOnce({ valid: true, total: 100 })
        sectorExistsMock.mockResolvedValueOnce(null)

        const element = await DashboardLayout({ children: <main>Dashboard content</main> })

        render(element)

        expect(screen.getByText('Dashboard content')).toBeInTheDocument()
        expect(screen.queryByText('Banco de dados indisponível')).not.toBeInTheDocument()
    })
})
