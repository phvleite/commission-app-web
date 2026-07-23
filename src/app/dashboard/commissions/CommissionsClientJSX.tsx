'use client'

import type { CommissionsClientState } from './CommissionsClient'
import CommissionsFilter from './components/CommissionsFilter'
import CommissionsReportAll from './components/CommissionsReportAll'
import CommissionsReportEmployee from './components/CommissionsReportEmployee'
import CommissionsSituation from './components/CommissionsSituation'

interface CommissionsClientJSXProps {
    client: CommissionsClientState
}

export default function CommissionsClientJSX({ client }: CommissionsClientJSXProps) {
    return (
        <section className="space-y-10">
            <CommissionsFilter
                startDate={client.startDate}
                endDate={client.endDate}
                employeeId={client.employeeId}
                employees={client.employees}
                employeesLoading={client.employeesLoading}
                showSituations={client.showSituations}

                setStartDate={client.setStartDate}
                setEndDate={client.setEndDate}
                setEmployeeId={client.setEmployeeId}
                setShowSituations={client.setShowSituations}

                onClear={client.clearFilters}
                onResult={client.setResult}
                listByPeriod={client.listByPeriod}
                listByPeriodEmployee={client.listByPeriodEmployee}
                listSituations={client.listSituations}
            />

            {client.result?.type === 'all' && (
                <>
                    <CommissionsReportAll result={client.result} />

                    {client.showSituations && (
                        <CommissionsSituation situations={client.result.situations} />
                    )}
                </>
            )}

            {client.result?.type === 'employee' && (
                <CommissionsReportEmployee result={client.result} />
            )}
        </section>
    )
}
