'use client'

import { EmployeesClient } from './EmployeesClient'
import type { EmployeeItem, SectorItem } from './EmployeesClient'
import { EmployeesClientJSX } from './EmployeesClientJSX'

interface Props {
    userRole: 'admin' | 'manager' | 'seller'
    initialEmployees: EmployeeItem[]
    initialSectors: SectorItem[]
}

export function EmployeesClientContainer({ userRole, initialEmployees, initialSectors }: Props) {
    const client = EmployeesClient({ userRole, initialEmployees, initialSectors })
    return <EmployeesClientJSX {...client} />
}
