/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
    it('direciona o cadastro para a escolha de planos sem exibir os valores', () => {
        render(<Home />)

        expect(screen.queryByText('Planos e valores')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Cadastrar empresa' })).toHaveAttribute(
            'href',
            '/planos',
        )
    })
})
