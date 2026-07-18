'use client'

import { SalesClient } from './SalesClient'
import type { ISaleClientProps } from './SalesClient'
import { SalesClientJSX } from './SalesClientJSX'

export function SalesClientContainer({ initialSales }: ISaleClientProps) {
    const client = SalesClient({ initialSales })
    return <SalesClientJSX {...client} />
}
