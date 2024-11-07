'use client'
import { useRouter } from "next/navigation";

export default function ButtonRedirect() {
    const router = useRouter();

    const handleNavigate = () => {
      router.push('/login')
    }
  return (
<button
      onClick={handleNavigate}>Chuyển trang Login</button>
  )
}
