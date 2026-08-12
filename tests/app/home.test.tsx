/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
    it('exibe os planos disponiveis no site publico', () => {
        render(<Home />)

        expect(screen.getByText('Planos e valores')).toBeInTheDocument()
        expect(screen.getByText('Ate 20 colaboradores')).toBeInTheDocument()
        expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument()
        expect(screen.getByText('Mais de 100 colaboradores')).toBeInTheDocument()
        expect(screen.getByText(/R\$\s*375,00/)).toBeInTheDocument()
    })
})
