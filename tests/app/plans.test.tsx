/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import PlansPage from '@/app/planos/page'

describe('Plans page', () => {
    it('exibe todos os planos com links para o cadastro', () => {
        render(<PlansPage />)

        expect(screen.getByText('Ate 20 colaboradores')).toBeInTheDocument()
        expect(screen.getByText('Mais de 100 colaboradores')).toBeInTheDocument()
        expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument()
        expect(screen.getByText(/R\$\s*375,00/)).toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: 'Escolher este plano' })).toHaveLength(4)
        expect(screen.getAllByRole('link', { name: 'Escolher este plano' })[3]).toHaveAttribute(
            'href',
            '/signup?plan=plan_100_plus',
        )
    })
})
