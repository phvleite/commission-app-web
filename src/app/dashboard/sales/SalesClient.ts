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

export interface PendingSaleItem {
    date: string
    value: number
    totalCommissionValue: number
    status: 'processing' | 'failed' | 'cancelled' | 'network_lost' | 'process_not_found'
    startedAt: string
    recoverable: boolean
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
    const [isResolvingPending, setIsResolvingPending] = useState(false)
    const [pendingSale, setPendingSale] = useState<PendingSaleItem | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [operationStatus, setOperationStatus] = useState<{
        status: 'idle' | 'processing' | 'success' | 'error' | 'offline'
        message: string
    }>({ status: 'idle', message: '' })

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

    const fetchPendingSale = useCallback(async () => {
        try {
            const response = await fetch('/api/sales/pending', withTimeZoneHeader())
            const payload = await readJsonResponse<{ pending?: PendingSaleItem | null }>(
                response,
                'Erro ao verificar lançamentos pendentes.',
            )

            if (response.ok) {
                setPendingSale(payload.pending ?? null)
            }
        } catch {
            // A próxima reconexão ou tentativa de salvar repetirá a verificação.
        }
    }, [])

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

    useEffect(() => {
        void fetchPendingSale()

        const handleOnline = () => void fetchPendingSale()
        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [fetchPendingSale])

    useEffect(() => {
        if (!pendingSale || pendingSale.recoverable) return

        const timeout = window.setTimeout(() => void fetchPendingSale(), 5_000)
        return () => window.clearTimeout(timeout)
    }, [fetchPendingSale, pendingSale])

    return {
        sales,
        editId,
        pendingSale,
        operationStatus,
        beginEdit: setEditId,
        cancelEdit: () => {
            setEditId(null)
            setOperationStatus({ status: 'idle', message: '' })
        },
        saveSale: async (date: string, value: number) => {
            const offlineMessage =
                'Sem conexão. A operação foi cancelada e os dados não foram salvos.'

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const error = new Error(offlineMessage)
                setOperationStatus({ status: 'offline', message: offlineMessage })
                setIsSaving(false)
                throw error
            }

            setIsSaving(true)
            setOperationStatus({
                status: 'processing',
                message: editId ? 'Salvando alterações da venda...' : 'Salvando nova venda...',
            })
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

                const json = await readJsonResponse<{
                    error?: string
                    errorCode?: string
                    pending?: PendingSaleItem
                }>(res, 'Erro ao salvar venda.')

                if (!res.ok) {
                    if (json.errorCode === 'pending_sale_recovery' && json.pending) {
                        setPendingSale(json.pending)
                    }
                    const message = json.error ?? 'Erro ao salvar venda.'
                    setOperationStatus({ status: 'error', message })
                    throw new Error(message)
                }

                const successMessage = editId
                    ? 'Venda atualizada e comissões validadas com sucesso.'
                    : 'Venda lançada e comissões validadas com sucesso.'

                setEditId(null)
                setOperationStatus({ status: 'success', message: successMessage })
                const nextPayload = await fetchSales(currentPage)
                setSales(nextPayload.sales)
                setCurrentPage(nextPayload.currentPage)
                setTotalPages(nextPayload.totalPages)
                setTotalItems(nextPayload.totalItems)
                await fetchPendingSale()
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Erro ao salvar venda.'

                const isNetworkFailure =
                    !navigator.onLine ||
                    /falha de rede|failed to fetch|network|offline|load failed/i.test(message)

                setOperationStatus({
                    status: isNetworkFailure ? 'offline' : 'error',
                    message: isNetworkFailure ? offlineMessage : message,
                })
                throw error
            } finally {
                setIsSaving(false)
            }
        },

        resolvePendingSale: async (action: 'complete' | 'discard') => {
            if (!pendingSale || isResolvingPending) return

            setIsResolvingPending(true)
            try {
                const response = await fetch(
                    '/api/sales/pending',
                    withTimeZoneHeader({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action, date: pendingSale.date.slice(0, 10) }),
                    }),
                )
                const payload = await readJsonResponse<{ error?: string }>(
                    response,
                    'Erro ao resolver lançamento pendente.',
                )

                if (!response.ok) {
                    throw new Error(payload.error ?? 'Erro ao resolver lançamento pendente.')
                }

                setPendingSale(null)
                setOperationStatus({
                    status: 'success',
                    message:
                        action === 'complete'
                            ? 'Lançamento pendente concluído com sucesso.'
                            : 'Lançamento pendente desconsiderado.',
                })
                const nextPayload = await fetchSales(currentPage)
                setSales(nextPayload.sales)
                setCurrentPage(nextPayload.currentPage)
                setTotalPages(nextPayload.totalPages)
                setTotalItems(nextPayload.totalItems)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Erro ao resolver lançamento pendente.'
                setOperationStatus({ status: 'error', message })
                toast.error(message)
            } finally {
                setIsResolvingPending(false)
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
        isResolvingPending,
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
