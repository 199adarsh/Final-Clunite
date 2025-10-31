"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle, ArrowLeft, Shield, Mail, User, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function HostVerificationPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [userEmail, setUserEmail] = useState("")
  const [clubEmail, setClubEmail] = useState("")
  const [clubName, setClubName] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Pre-fill user email if logged in
  useEffect(() => {
    if (authUser?.email) {
      setUserEmail(authUser.email)
    }
  }, [authUser])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  const sendOtp = async () => {
    try {
      setError("")
      setIsSending(true)
      const clubId = sessionStorage.getItem('selectedClubId')
      if (!authUser) {
        setError("Please log in first")
        setIsSending(false)
        return
      }
      let resolvedClubId = clubId
      if (!resolvedClubId) {
        if (!clubName) {
          setError("Enter your club name or select a club first")
          setIsSending(false)
          return
        }
        const { data: memberships } = await supabase
          .from('club_memberships')
          .select('club_id, club:clubs(name)')
          .eq('user_id', authUser.id)
          .eq('role', 'admin')
        const match = (memberships || []).find((m: any) => (m.club?.name || '').toLowerCase() === clubName.toLowerCase())
        if (!match) {
          setError("No admin access found for a club with that name")
          setIsSending(false)
          return
        }
        resolvedClubId = match.club_id
        sessionStorage.setItem('selectedClubId', resolvedClubId)
        sessionStorage.setItem('selectedClubName', clubName)
      }
      const res = await fetch('/api/club-access/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: resolvedClubId, userId: authUser.id, email: clubEmail })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to send OTP')
      }
      toast.success('OTP sent to the official club email')
      setSecondsLeft(60)
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (!userEmail || otp.length !== 6) {
        setError("Please enter the OTP")
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

      let clubId = sessionStorage.getItem('selectedClubId')
      let selectedName = sessionStorage.getItem('selectedClubName') || clubName
      if (!clubId) {
        if (!clubName) {
          setError("Enter your club name or select a club first")
          setIsSubmitting(false)
          return
        }
        const { data: memberships } = await supabase
          .from('club_memberships')
          .select('club_id, club:clubs(name)')
          .eq('user_id', authUser.id)
          .eq('role', 'admin')
        const match = (memberships || []).find((m: any) => (m.club?.name || '').toLowerCase() === clubName.toLowerCase())
        if (!match) {
          setError("No admin access found for a club with that name")
          setIsSubmitting(false)
          return
        }
        clubId = match.club_id
        selectedName = clubName
        sessionStorage.setItem('selectedClubId', clubId)
        sessionStorage.setItem('selectedClubName', selectedName)
      }

      // Verify OTP
      const res = await fetch('/api/club-access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, userId: authUser.id, code: otp })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Verification failed')
      }

      // Ensure this user is an admin of that club
      const { data: membership, error: membershipError } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('club_id', clubId)
        .eq('role', 'admin')
        .single()
      if (membershipError || !membership) {
        setError("You are not an admin of this club")
        setIsSubmitting(false)
        return
      }

      sessionStorage.setItem('hostVerified', 'true')
      toast.success(`Access granted for ${selectedName || 'club'}!`)
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
              <Shield className="h-4 w-4 text-orange-500" />
              <p>Secure Access Required</p>
            </div>
            <p className="text-sm text-slate-600 text-center mt-2">
              Verify your admin access for {clubName || 'your club'}
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

              {/* Club Name (optional if already selected) */}
              <div className="space-y-2">
                <Label htmlFor="clubName" className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Club Name
                </Label>
                <Input
                  id="clubName"
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g., Tech Club"
                  className="h-12 border-2"
                />
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

              {/* Send OTP */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={sendOtp} disabled={isSending || secondsLeft > 0 || !clubEmail} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSending ? 'Sending...' : 'Send OTP'}
                  </Button>
                  {secondsLeft > 0 && (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Resend in {secondsLeft}s
                    </div>
                  )}
                </div>
              </div>

              {/* 6-digit OTP */}
              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  6-digit OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="h-12 text-center text-xl tracking-widest font-mono border-2 focus:border-indigo-500"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-slate-500">Enter the code sent to the official club email</p>
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
                disabled={isSubmitting || !userEmail || otp.length !== 6}
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