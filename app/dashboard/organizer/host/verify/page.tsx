"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle, ArrowLeft, Shield, Mail, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function HostVerificationPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [userEmail, setUserEmail] = useState("")
  const [clubEmail, setClubEmail] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill user email if logged in
  useEffect(() => {
    if (authUser?.email) {
      setUserEmail(authUser.email)
    }
  }, [authUser])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!userEmail || !clubEmail || !pin) {
        setError("Please fill in all fields")
        setIsSubmitting(false)
        return
      }

      if (pin.length !== 8) {
        setError("PIN must be exactly 8 digits")
        setIsSubmitting(false)
        return
      }

      // Check if user is authenticated
      if (!authUser) {
        setError("Please log in first")
        setIsSubmitting(false)
        return
      }

      // Verify user email matches logged in user
      if (userEmail.toLowerCase() !== authUser.email?.toLowerCase()) {
        setError("Email doesn't match your account")
        setIsSubmitting(false)
        return
      }

      console.log('Verifying access:', { userEmail, clubEmail, pin })

      // Find club by official email and PIN
      const { data: pendingClub, error: clubError } = await supabase
        .from('pending_clubs')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('official_email', clubEmail)
        .eq('pin', pin)
        .single()

      if (clubError || !pendingClub) {
        console.error('Club not found:', clubError)
        setError("Invalid club email or PIN")
        setIsSubmitting(false)
        return
      }

      // Check if PIN expired
      if (new Date(pendingClub.expires_at) < new Date()) {
        setError("PIN has expired (48 hours)")
        setIsSubmitting(false)
        return
      }

      // Check if user is an admin of this club
      const { data: membership, error: membershipError } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('club_id', pendingClub.club_id)
        .eq('role', 'admin')
        .single()

      if (membershipError || !membership) {
        console.error('Not an admin:', membershipError)
        setError("You are not an admin of this club. Please verify with the club PIN first.")
        setIsSubmitting(false)
        return
      }

      // Success! Store club info and redirect
      sessionStorage.setItem('hostVerified', 'true')
      sessionStorage.setItem('selectedClubId', pendingClub.club_id)
      sessionStorage.setItem('selectedClubName', pendingClub.club.name)
      
      toast.success(`Access granted for ${pendingClub.club.name}!`)
      router.push('/dashboard/organizer/host')

    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Verification failed')
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="space-y-1 pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-center">Host Event Access</CardTitle>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4 text-indigo-500" />
              <p>Secure Access Required</p>
            </div>
            <p className="text-sm text-slate-600 text-center mt-2">
              Verify your club admin access
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-5">
              {/* User Email */}
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-indigo-600" />
                  Your Email
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="h-12 border-2 focus:border-indigo-500"
                  required
                  disabled={!!authUser?.email}
                />
                <p className="text-xs text-slate-500">Must match your logged-in account</p>
              </div>

              {/* Club Official Email */}
              <div className="space-y-2">
                <Label htmlFor="clubEmail" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Club Official Email
                </Label>
                <Input
                  id="clubEmail"
                  type="email"
                  value={clubEmail}
                  onChange={(e) => setClubEmail(e.target.value)}
                  placeholder="club@college.edu"
                  className="h-12 border-2 focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-slate-500">The email used when creating the club</p>
              </div>

              {/* 8-Digit PIN */}
              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  8-Digit PIN
                </Label>
                <Input
                  id="pin"
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  className="h-12 text-center text-xl tracking-widest font-mono border-2 focus:border-indigo-500"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-slate-500">The PIN sent to the club email</p>
              </div>

              {error && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isSubmitting || !userEmail || !clubEmail || pin.length !== 8}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Verifying Access...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verify & Access
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-center text-slate-600 mb-3">
                Don't have a club yet?
              </p>
              <Link href="/dashboard/organizer/create-club">
                <Button
                  variant="outline"
                  className="w-full border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 py-6 rounded-xl transition-all duration-300"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Create New Club
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}