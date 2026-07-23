'use client'

import CommissionsClientJSX from './CommissionsClientJSX'
import { useCommissionsClient } from './CommissionsClient'

export default function CommissionsClientContainer() {
    const client = useCommissionsClient()

    return (
        <div className="panel mx-auto w-full max-w-4xl p-6 sm:p-8">
            <h1 className="gold-bar-title text-2xl font-bold mb-10">Comissões</h1>

            <CommissionsClientJSX client={client} />
        </div>
    )
}
