'use client'

import { useSalesClient } from './SalesClient'
import type { ISaleClientProps } from './SalesClient'
import { SalesClientJSX } from './SalesClientJSX'

export function SalesClientContainer({ initialSales }: ISaleClientProps) {
    const client = useSalesClient(initialSales)

    return (
        <div className="panel mx-auto w-full max-w-4xl p-6 sm:p-8 border border-(--color-border) bg-surface">
            <h1 className="gold-bar-title text-2xl font-bold mb-10">
                Vendas
            </h1>

            <SalesClientJSX client={client} />
        </div>
    )
}
