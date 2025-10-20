"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function MyHostedEventsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main organizer dashboard since this page is no longer needed
    router.push("/dashboard/organizer")
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="border-0 shadow-lg bg-white max-w-md">
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    </div>
  )
}
