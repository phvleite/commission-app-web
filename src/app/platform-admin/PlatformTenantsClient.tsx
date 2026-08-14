'use client'

import { useState } from 'react'
import { listServicePlans, type ServicePlanCode } from '@/lib/service-plans'

const TENANT_BILLING_STATUS = ['pending', 'active', 'overdue', 'suspended', 'canceled'] as const

type TenantBillingStatus = (typeof TENANT_BILLING_STATUS)[number]

interface TenantDiscount {
    code: string
    percentage: number
    isAbrasel?: boolean
}

export interface PlatformTenant {
    _id: string
    name: string
    slug: string
    planCode: ServicePlanCode
    billingStatus: TenantBillingStatus
    nextBillingAt?: string
    monthlyPriceOverrideCents?: number
    effectiveMonthlyPriceCents: number
    maxUsers: number
    active: boolean
    discounts: TenantDiscount[]
}

interface Props {
    initialTenants: PlatformTenant[]
}

interface PlatformTenantEditState {
    planCode: ServicePlanCode
    billingStatus: TenantBillingStatus
    nextBillingAt: string
    monthlyPriceOverrideCents: string
    discounts: TenantDiscount[]
}

const PLAN_OPTIONS = listServicePlans()

function formatCurrencyFromCents(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value / 100)
}

function getEditStateFromTenant(tenant: PlatformTenant): PlatformTenantEditState {
    return {
        planCode: tenant.planCode,
        billingStatus: tenant.billingStatus,
        nextBillingAt: tenant.nextBillingAt ? tenant.nextBillingAt.slice(0, 10) : '',
        monthlyPriceOverrideCents:
            typeof tenant.monthlyPriceOverrideCents === 'number'
                ? String(tenant.monthlyPriceOverrideCents)
                : '',
        discounts: tenant.discounts.length > 0 ? tenant.discounts : [],
    }
}

export function PlatformTenantsClient({ initialTenants }: Props) {
    const [tenants, setTenants] = useState(initialTenants)
    const [editingTenantId, setEditingTenantId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<PlatformTenantEditState | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    function startEditing(tenant: PlatformTenant) {
        setError(null)
        setSuccess(null)
        setEditingTenantId(tenant._id)
        setEditForm(getEditStateFromTenant(tenant))
    }

    function cancelEditing() {
        setEditingTenantId(null)
        setEditForm(null)
    }

    function addDiscountRow() {
        if (!editForm) {
            return
        }

        setEditForm({
            ...editForm,
            discounts: [...editForm.discounts, { code: '', percentage: 0 }],
        })
    }

    function updateDiscountRow(index: number, nextDiscount: TenantDiscount) {
        if (!editForm) {
            return
        }

        setEditForm({
            ...editForm,
            discounts: editForm.discounts.map((discount, currentIndex) =>
                currentIndex === index ? nextDiscount : discount,
            ),
        })
    }

    function removeDiscountRow(index: number) {
        if (!editForm) {
            return
        }

        setEditForm({
            ...editForm,
            discounts: editForm.discounts.filter((_, currentIndex) => currentIndex !== index),
        })
    }

    async function handleSaveTenant(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!editingTenantId || !editForm) {
            return
        }

        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/platform-admin/tenants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTenantId,
                    planCode: editForm.planCode,
                    billingStatus: editForm.billingStatus,
                    nextBillingAt: editForm.nextBillingAt || null,
                    monthlyPriceOverrideCents:
                        editForm.monthlyPriceOverrideCents === ''
                            ? null
                            : Number(editForm.monthlyPriceOverrideCents),
                    discounts: editForm.discounts.map((discount) => ({
                        code: discount.code.trim(),
                        percentage: Number(discount.percentage),
                        ...(discount.isAbrasel ? { isAbrasel: true } : {}),
                    })),
                }),
            })

            const payload = (await response.json()) as {
                data?: PlatformTenant
                error?: string
            }

            if (!response.ok) {
                throw new Error(payload.error ?? 'Nao foi possivel atualizar o tenant.')
            }

            if (payload.data) {
                setTenants((currentTenants) =>
                    currentTenants.map((tenant) =>
                        tenant._id === payload.data?._id ? payload.data : tenant,
                    ),
                )
            }

            cancelEditing()
            setSuccess('Configuracoes comerciais do tenant atualizadas com sucesso.')
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar tenant.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="rounded-3xl border border-(--color-border) bg-white/85 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                        Gestao comercial
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-(--color-primary-strong)">
                        Tenants e planos
                    </h2>
                </div>
                <span className="rounded-full border border-(--color-border) bg-(--color-background-soft) px-3 py-1 text-xs font-semibold text-(--color-muted)">
                    {tenants.length} tenants
                </span>
            </div>

            {error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </p>
            ) : null}

            {success ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </p>
            ) : null}

            <div className="mt-5 space-y-3">
                {tenants.map((tenant) => {
                    const resolvedPlan = PLAN_OPTIONS.find((plan) => plan.code === tenant.planCode)

                    return (
                        <article
                            key={tenant._id}
                            className="rounded-2xl border border-(--color-border) bg-(--color-background-soft) p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-(--color-primary-strong)">
                                        {tenant.name}
                                    </p>
                                    <p className="mt-1 text-sm text-(--color-muted)">
                                        {tenant.slug}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong)">
                                            {resolvedPlan?.name ?? tenant.planCode}
                                        </span>
                                        <span className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong)">
                                            Limite {tenant.maxUsers} usuarios
                                        </span>
                                        <span className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong)">
                                            {tenant.billingStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-(--color-muted)">
                                        Mensalidade efetiva
                                    </p>
                                    <p className="text-lg font-semibold text-(--color-primary-strong)">
                                        {formatCurrencyFromCents(tenant.effectiveMonthlyPriceCents)}
                                    </p>
                                    <p className="mt-1 text-xs text-(--color-muted)">
                                        Base do plano:{' '}
                                        {resolvedPlan
                                            ? formatCurrencyFromCents(
                                                  resolvedPlan.monthlyPriceCents,
                                              )
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-xs font-semibold text-(--color-primary-strong) transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => startEditing(tenant)}
                                >
                                    Editar comercial
                                </button>
                            </div>

                            {editingTenantId === tenant._id && editForm ? (
                                <form className="mt-4 grid gap-3" onSubmit={handleSaveTenant}>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                            <span>Plano</span>
                                            <select
                                                className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                                value={editForm.planCode}
                                                onChange={(event) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        planCode: event.target
                                                            .value as ServicePlanCode,
                                                    })
                                                }
                                            >
                                                {PLAN_OPTIONS.map((plan) => (
                                                    <option key={plan.code} value={plan.code}>
                                                        {plan.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                            <span>Status de cobranca</span>
                                            <select
                                                className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                                value={editForm.billingStatus}
                                                onChange={(event) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        billingStatus: event.target
                                                            .value as TenantBillingStatus,
                                                    })
                                                }
                                            >
                                                {TENANT_BILLING_STATUS.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                            <span>Mensalidade customizada (centavos)</span>
                                            <input
                                                className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={editForm.monthlyPriceOverrideCents}
                                                onChange={(event) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        monthlyPriceOverrideCents:
                                                            event.target.value,
                                                    })
                                                }
                                                placeholder="Ex.: 19990"
                                            />
                                        </label>

                                        <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                            <span>Proxima cobranca</span>
                                            <input
                                                className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                                type="date"
                                                value={editForm.nextBillingAt}
                                                onChange={(event) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        nextBillingAt: event.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>

                                    <div className="rounded-2xl border border-(--color-border) bg-white/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-(--color-primary-strong)">
                                                    Descontos
                                                </p>
                                                <p className="mt-1 text-xs text-(--color-muted)">
                                                    Configure descontos por tenant sem alterar os
                                                    direitos do plano.
                                                </p>
                                            </div>
                                            <button
                                                className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-xs font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
                                                type="button"
                                                onClick={addDiscountRow}
                                            >
                                                Adicionar desconto
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {editForm.discounts.map((discount, index) => (
                                                <div
                                                    key={`${tenant._id}-discount-${index}`}
                                                    className="grid gap-3 rounded-2xl border border-(--color-border) bg-(--color-background-soft) p-3 lg:grid-cols-[1.2fr_0.8fr_auto_auto]"
                                                >
                                                    <input
                                                        className="input-field rounded-xl border border-(--color-border) px-4 py-3"
                                                        value={discount.code}
                                                        onChange={(event) =>
                                                            updateDiscountRow(index, {
                                                                ...discount,
                                                                code: event.target.value,
                                                            })
                                                        }
                                                        placeholder="Codigo do desconto"
                                                    />
                                                    <input
                                                        className="input-field rounded-xl border border-(--color-border) px-4 py-3"
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.01}
                                                        value={discount.percentage}
                                                        onChange={(event) =>
                                                            updateDiscountRow(index, {
                                                                ...discount,
                                                                percentage: Number(
                                                                    event.target.value || 0,
                                                                ),
                                                            })
                                                        }
                                                        placeholder="Percentual"
                                                    />
                                                    <label className="flex items-center gap-2 rounded-xl border border-(--color-border) bg-white px-4 py-3 text-sm text-(--color-primary-strong)">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(discount.isAbrasel)}
                                                            onChange={(event) =>
                                                                updateDiscountRow(index, {
                                                                    ...discount,
                                                                    isAbrasel: event.target.checked,
                                                                })
                                                            }
                                                        />
                                                        Abrasel
                                                    </label>
                                                    <button
                                                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                                                        type="button"
                                                        onClick={() => removeDiscountRow(index)}
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}

                                            {editForm.discounts.length === 0 ? (
                                                <p className="rounded-xl border border-dashed border-(--color-border) bg-(--color-background-soft) p-3 text-sm text-(--color-muted)">
                                                    Nenhum desconto configurado.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            className="primary-button rounded-xl border border-(--color-border) bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isSubmitting}
                                            type="submit"
                                        >
                                            {isSubmitting ? 'Salvando...' : 'Salvar configuracoes'}
                                        </button>
                                        <button
                                            className="cancel-button rounded-xl border border-(--color-border) px-4 py-2 text-sm font-semibold"
                                            disabled={isSubmitting}
                                            type="button"
                                            onClick={cancelEditing}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : null}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
