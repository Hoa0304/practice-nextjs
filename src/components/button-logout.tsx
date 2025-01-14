'use client'

import authApiRequest from '@/apiRequests/auth'
import { useAppContext } from '@/app/AppProvider'
import { Button } from '@/components/ui/button'
import { ApiError, handleErrorApi } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'

function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'payload' in error &&
        typeof (error as ApiError).payload?.message === 'string'
    );
}

export default function ButtonLogout() {
    const { setUser } = useAppContext()
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        try {
            await authApiRequest.logoutFromNextClientToNextServer()
            router.push('/login')
        } catch (error: unknown) {
            if (isApiError(error)) {
                handleErrorApi({
                    error: error
                })
            } else {
                handleErrorApi({
                    error: { payload: { message: 'Đã xảy ra lỗi không xác định.' } }
                })
            }

            authApiRequest.logoutFromNextClientToNextServer(true).then(() => {
                router.push(`/login?redirectFrom=${pathname}`)
            })
        } finally {
            setUser(null)
            router.refresh()
            localStorage.removeItem('sessionToken')
            localStorage.removeItem('sessionTokenExpiresAt')
        }
    }

    return (
        <Button size={'sm'} onClick={handleLogout}>
            Đăng xuất
        </Button>
    )
}
