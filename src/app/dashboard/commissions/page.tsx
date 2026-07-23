import { auth } from '@/auth'
import CommissionsClientContainer from './CommissionsClientContainer'

export default async function CommissionsPage() {
    const session = await auth()
    if (!session) return null

    return <CommissionsClientContainer />
}
