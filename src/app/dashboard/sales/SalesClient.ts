'use client'

import { readJsonResponse } from '@/lib/api/fetchJson'
import { withTimeZoneHeader } from '@/lib/api/time-zone-header'
import { createElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SalesClientContainer } from './SalesClientContainer'

interface SaleItem {
    _id: string
    date: string
    value: number
    totalCommissionValue: number
}

interface PaginatedSalesResponse {
    sales?: SaleItem[]
    currentPage?: number
    totalPages?: number
    totalItems?: number
    pageSize?: number
    error?: string
}

const PAGE_SIZE = 50

export interface ISaleClientProps {
    initialSales: SaleItem[]
    initialStartDate?: string
    initialEndDate?: string
    initialCurrentPage?: number
    initialTotalPages?: number
    initialTotalItems?: number
    initialPageSize?: number
}

export default function SalesClient(props: ISaleClientProps) {
    const {
        initialSales,
        initialStartDate,
        initialEndDate,
        initialCurrentPage,
        initialTotalPages,
        initialTotalItems,
        initialPageSize,
    } = props
    return createElement(SalesClientContainer, {
        initialSales,
        initialStartDate,
        initialEndDate,
        initialCurrentPage,
        initialTotalPages,
        initialTotalItems,
        initialPageSize,
    })
}

export function useSalesClient(
    initialSales: SaleItem[],
    initialStartDate = '',
    initialEndDate = '',
    initialCurrentPage = 1,
    initialTotalPages = 1,
    initialTotalItems = initialSales.length,
    initialPageSize = PAGE_SIZE,
) {
    const [sales, setSales] = useState(initialSales)
    const [currentPage, setCurrentPage] = useState(initialCurrentPage)
    const [totalPages, setTotalPages] = useState(initialTotalPages)
    const [totalItems, setTotalItems] = useState(initialTotalItems)
    const [pageSize] = useState(initialPageSize)
    const [editId, setEditId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState(initialStartDate)
    const [endDate, setEndDate] = useState(initialEndDate)
    const [modalDate, setModalDate] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const fetchSales = useCallback(
        async (pageToLoad: number) => {
            const params = new URLSearchParams()
            if (startDate) params.append('start', startDate)
            if (endDate) params.append('end', endDate)
            params.append('page', String(pageToLoad))
            params.append('pageSize', String(PAGE_SIZE))

            try {
                const res = await fetch(`/api/sales?${params.toString()}`, withTimeZoneHeader())
                const json = await readJsonResponse<PaginatedSalesResponse>(
                    res,
                    'Erro ao carregar vendas.',
                )

                if (!res.ok) {
                    throw new Error(json.error ?? 'Erro ao carregar vendas.')
                }

                return {
                    sales: json.sales ?? [],
                    currentPage: json.currentPage ?? 1,
                    totalPages: json.totalPages ?? 1,
                    totalItems: json.totalItems ?? 0,
                    pageSize: json.pageSize ?? PAGE_SIZE,
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Erro ao carregar vendas.'
                toast.error(message)
                return {
                    sales: [],
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    pageSize: PAGE_SIZE,
                }
            }
        },
        [startDate, endDate],
    )

    useEffect(() => {
        let isCancelled = false

        async function syncSales() {
            setIsLoading(true)
            const nextPayload = await fetchSales(currentPage)
            if (!isCancelled) {
                setSales(nextPayload.sales)
                setCurrentPage(nextPayload.currentPage)
                setTotalPages(nextPayload.totalPages)
                setTotalItems(nextPayload.totalItems)
                setIsLoading(false)
            }
        }

        void syncSales()

        return () => {
            isCancelled = true
        }
    }, [fetchSales, currentPage])

    return {
        sales,
        editId,
        beginEdit: setEditId,
        cancelEdit: () => setEditId(null),
        saveSale: async (date: string, value: number) => {
            setIsSaving(true)
            const body = JSON.stringify({ date, value })
            let res

            try {
                if (!editId) {
                    res = await fetch(
                        '/api/sales',
                        withTimeZoneHeader({
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body,
                        }),
                    )
                } else {
                    res = await fetch(
                        `/api/sales/${editId}`,
                        withTimeZoneHeader({
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body,
                        }),
                    )
                }

                const json = await readJsonResponse<{ error?: string }>(
                    res,
                    'Erro ao salvar venda.',
                )
                if (!res.ok) throw new Error(json.error)
                setEditId(null)
                const nextPayload = await fetchSales(currentPage)
                setSales(nextPayload.sales)
                setCurrentPage(nextPayload.currentPage)
                setTotalPages(nextPayload.totalPages)
                setTotalItems(nextPayload.totalItems)
            } finally {
                setIsSaving(false)
            }
        },

        startDate,
        endDate,
        setStartDate: (value: string) => {
            setCurrentPage(1)
            setStartDate(value)
        },
        setEndDate: (value: string) => {
            setCurrentPage(1)
            setEndDate(value)
        },
        clearFilters: () => {
            setCurrentPage(1)
            setStartDate(initialStartDate)
            setEndDate(initialEndDate)
        },

        modalDate,
        openModal: setModalDate,
        closeModal: () => setModalDate(null),
        isSaving,
        isLoading,
        currentPage,
        totalPages,
        totalItems,
        pageSize,
        canGoPrevious: currentPage > 1,
        canGoNext: currentPage < totalPages,
        goToPreviousPage: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
        goToNextPage: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
    }
}
