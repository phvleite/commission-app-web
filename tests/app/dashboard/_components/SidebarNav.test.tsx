/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { SidebarNav } from '@/app/dashboard/_components/SidebarNav'

const usePathnameMock = jest.fn()

jest.mock('next/navigation', () => ({
    usePathname: () => usePathnameMock(),
}))

jest.mock('next/link', () => {
    return function LinkMock(props: {
        href: string
        className?: string
        children: React.ReactNode
        onClick?: () => void
    }) {
        return (
            <a href={props.href} className={props.className} onClick={props.onClick}>
                {props.children}
            </a>
        )
    }
})

describe('SidebarNav', () => {
    beforeEach(() => {
        usePathnameMock.mockReturnValue('/dashboard')
    })

    afterEach(() => {
        usePathnameMock.mockReset()
    })

    it('renders user identity and role', () => {
        render(<SidebarNav userName="Paulo" role="admin" sectorsOk hasMeritocraciaSector={false} />)

        expect(screen.getByText('Paulo')).toBeInTheDocument()
        expect(screen.getByText('Perfil: admin')).toBeInTheDocument()
    })

    it('disables guarded menu entries when sectors are not ok', () => {
        render(
            <SidebarNav
                userName="Paulo"
                role="admin"
                sectorsOk={false}
                hasMeritocraciaSector={false}
            />,
        )

        expect(screen.getByText('Setores').closest('a')).not.toBeNull()
        expect(screen.getByText('Empresa/Usuários').closest('a')).not.toBeNull()

        expect(screen.getByText('Colaboradores').closest('a')).toBeNull()
        expect(screen.getByText('Situações').closest('a')).toBeNull()
        expect(screen.getByText('Gorjetas').closest('a')).toBeNull()
    })

    it('opens and closes mobile menu', () => {
        render(<SidebarNav userName="Paulo" role="admin" sectorsOk hasMeritocraciaSector={false} />)

        fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
        expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
        expect(screen.queryByRole('button', { name: 'Fechar menu' })).not.toBeInTheDocument()
    })

    it('hides the meritocracy menu item when there is no meritocracy sector', () => {
        render(<SidebarNav userName="Paulo" role="admin" sectorsOk hasMeritocraciaSector={false} />)

        expect(screen.queryByText('Lançamento Meritocracia')).not.toBeInTheDocument()
    })

    it('shows the meritocracy menu item enabled when sector exists and sectors sum 100%', () => {
        render(<SidebarNav userName="Paulo" role="admin" sectorsOk hasMeritocraciaSector />)

        expect(screen.getByText('Lançamento Meritocracia').closest('a')).not.toBeNull()
    })

    it('shows the meritocracy menu item disabled when sector exists but sectors do not sum 100%', () => {
        render(<SidebarNav userName="Paulo" role="admin" sectorsOk={false} hasMeritocraciaSector />)

        expect(screen.getByText('Lançamento Meritocracia').closest('a')).toBeNull()
    })
})
