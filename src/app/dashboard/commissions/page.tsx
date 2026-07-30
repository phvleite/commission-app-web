import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CommissionsClientContainer from './CommissionsClientContainer'

export default async function CommissionsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }

    return <CommissionsClientContainer />
}
