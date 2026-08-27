"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/auth/login')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="text-sm font-medium text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  )
}
