'use client'

import { createElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { SalesClientContainer } from './SalesClientContainer'

interface SaleItem {
    _id: string
    date: string
    value: number
    totalCommissionValue: number
}

export interface ISaleClientProps {
    initialSales: SaleItem[]
}

export default function SalesClient(props: ISaleClientProps) {
    const { initialSales } = props
    return createElement(SalesClientContainer, { initialSales })
}

export function useSalesClient(initialSales: SaleItem[]) {
    const [sales, setSales] = useState(initialSales)
    const [editId, setEditId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [modalDate, setModalDate] = useState<string | null>(null)

    const fetchSales = useCallback(async () => {
        const params = new URLSearchParams()
        if (startDate) params.append('start', startDate)
        if (endDate) params.append('end', endDate)

        const res = await fetch(`/api/sales?${params.toString()}`)
        const json = await res.json()

        return json.sales as SaleItem[]
    }, [startDate, endDate])

    useEffect(() => {
        let isCancelled = false

        async function syncSales() {
            const nextSales = await fetchSales()
            if (!isCancelled) {
                setSales(nextSales)
            }
        }

        void syncSales()

        return () => {
            isCancelled = true
        }
    }, [fetchSales])

    return {
        sales,
        editId,
        beginEdit: setEditId,
        cancelEdit: () => setEditId(null),
        saveSale: async (date: string, value: number) => {
            const body = JSON.stringify({ date, value })
            let res

            if (!editId) {
                res = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                })
            } else {
                res = await fetch(`/api/sales/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                })
            }

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            setEditId(null)
            const nextSales = await fetchSales()
            setSales(nextSales)
        },

        startDate,
        endDate,
        setStartDate,
        setEndDate,
        clearFilters: () => {
            setStartDate('')
            setEndDate('')
        },

        modalDate,
        openModal: setModalDate,
        closeModal: () => setModalDate(null),
    }
}
