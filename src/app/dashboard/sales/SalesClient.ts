'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface ISaleClientProps {
    initialSales: Array<{
        _id: string
        date: string
        value: number
        totalCommissionValue: number
    }>
}

export function SalesClient({ initialSales }: ISaleClientProps) {
    // ===========================
    // ESTADOS PRINCIPAIS
    // ===========================
    const [sales, setSales] = useState(initialSales)
    const [editId, setEditId] = useState<string | null>(null)

    // ===========================
    // FILTROS POR PERÍODO
    // ===========================
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    // ===========================
    // MODAL DE SETORES
    // ===========================
    const [modalDate, setModalDate] = useState<string | null>(null)

    // ===========================
    // CARREGAR VENDAS
    // ===========================
    const loadSales = useCallback(async () => {
        try {
            const params = new URLSearchParams()

            if (startDate) params.append('start', startDate)
            if (endDate) params.append('end', endDate)

            const res = await fetch(`/api/sales?${params.toString()}`)
            const json = await res.json()

            setSales(json.sales)
        } catch {
            toast.error('Erro ao carregar vendas.')
        }
    }, [startDate, endDate])

    // ===========================
    // FILTRAR AUTOMATICAMENTE
    // ===========================
    useEffect(() => {
        loadSales()
    }, [loadSales])

    // ===========================
    // LIMPAR FILTROS
    // ===========================
    function clearFilters() {
        setStartDate('')
        setEndDate('')
    }

    // ===========================
    // EDITAR VENDA
    // ===========================
    function beginEdit(id: string) {
        setEditId(id)
    }

    function cancelEdit() {
        setEditId(null)
    }

    // ===========================
    // SALVAR VENDA
    // ===========================
    async function saveSale(data: string, value: number) {
        try {
            const body = JSON.stringify({ date: data, value })

            let res

            if (!editId) {
                // CRIAR
                res = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                })
            } else {
                // EDITAR
                res = await fetch(`/api/sales/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                })
            }

            const json = await res.json()

            if (!res.ok) {
                toast.error(json.error ?? 'Erro ao salvar venda.')
                return
            }

            toast.success(editId ? 'Venda alterada.' : 'Venda registrada.')
            setEditId(null)
            loadSales()
        } catch {
            toast.error('Erro ao salvar venda.')
        }
    }

    // ===========================
    // ABRIR MODAL DE SETORES
    // ===========================
    function openModal(date: string) {
        setModalDate(date)
    }

    function closeModal() {
        setModalDate(null)
    }

    // ===========================
    // RETORNO PARA O JSX
    // ===========================
    return {
        sales,
        editId,
        beginEdit,
        cancelEdit,
        saveSale,

        startDate,
        endDate,
        setStartDate,
        setEndDate,
        clearFilters,

        modalDate,
        openModal,
        closeModal,
    }
}
