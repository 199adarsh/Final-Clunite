"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip verification check for the verify page itself
    if (pathname === "/dashboard/organizer/host/verify") {
      return
    }

    // Check if user is verified
    const isVerified = sessionStorage.getItem("hostVerified") === "true"
    
    if (!isVerified) {
      router.push("/dashboard/organizer/host/verify")
    }
  }, [pathname, router])

  return <>{children}</>
}