"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ensureUserExists } from "@/lib/sync-user"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Shield, CheckCircle2, Mail, Users, Clock } from "lucide-react"

export default function VerifyClubPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [pin, setPin] = useState("")
  const [pendingClubData, setPendingClubData] = useState<any>(null)
  const [pendingClubId, setPendingClubId] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    // Load pending club ID from sessionStorage
    const storedId = sessionStorage.getItem('pendingClubId')
    if (storedId) {
      setPendingClubId(storedId)
      loadPendingClub(storedId)
    } else {
      toast.error('No pending club found. Please create a club first.')
      router.push('/dashboard/organizer/create-club')
    }
  }, [])

  const loadPendingClub = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pending_clubs')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        console.error('Failed to load pending club:', error)
        toast.error('Failed to load club data. Please try again.')
        router.push('/dashboard/organizer/create-club')
        return
      }

      setPendingClubData(data)
    } catch (error: any) {
      console.error('Error loading pending club:', error)
      toast.error('Error loading club data')
    }
  }


  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Validate inputs
      if (!pendingClubData || !pendingClubId) {
        toast.error("No pending club data found")
        setLoading(false)
        return
      }

      if (pin.length !== 8) {
        toast.error("PIN must be exactly 8 digits")
        setLoading(false)
        return
      }

      // 2. Verify PIN matches
      if (pin !== pendingClubData.pin) {
        toast.error("Invalid PIN. Please check your email and try again.")
        setLoading(false)
        return
      }

      // 3. Check authentication
      if (!authUser) {
        toast.error("You must be logged in to verify a club")
        setLoading(false)
        return
      }

      console.log('PIN verified! Creating club now...')

      // 4. Ensure user exists in database
      const userSyncResult = await ensureUserExists(authUser, { college: pendingClubData.club_data.college })
      
      if (!userSyncResult.success) {
        console.error('Failed to sync user:', userSyncResult.error)
        toast.error("Failed to verify user account. Please try again.")
        setLoading(false)
        return
      }

      // 5. Upload banner NOW (after PIN verification)
      let bannerUrl = null
      const pendingBanner = sessionStorage.getItem('pendingBannerFile')
      if (pendingBanner) {
        try {
          const bannerData = JSON.parse(pendingBanner)
          // Convert base64 back to file
          const response = await fetch(bannerData.data)
          const blob = await response.blob()
          const file = new File([blob], bannerData.name, { type: bannerData.type })
          
          // Upload to Club Banner bucket
          const formData = new FormData()
          formData.append('file', file)
          formData.append('bucket', 'Club Banner')
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            bannerUrl = uploadData.url
            console.log('✅ Banner uploaded:', bannerUrl)
          }
        } catch (err) {
          console.error('Banner upload error:', err)
          // Continue without banner
        }
      }

      // 6. NOW CREATE THE CLUB (after PIN verification and banner upload)
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: pendingClubData.club_data.name,
          tagline: pendingClubData.club_data.tagline,
          description: pendingClubData.club_data.description,
          vision: pendingClubData.club_data.vision,
          category: pendingClubData.club_data.category,
          college: pendingClubData.club_data.college,
          founding_date: pendingClubData.club_data.founding_date,
          contact_email: pendingClubData.club_data.contact_email,
          faculty_in_charge: pendingClubData.club_data.faculty_in_charge,
          banner_url: bannerUrl,
          is_verified: true, // Verified via PIN
          created_by: authUser.id,
          members_count: 1,
          events_hosted_count: 0,
          credibility_score: 0
        })
        .select()
        .single()

      if (clubError || !club) {
        console.error('Club creation error:', clubError)
        toast.error(`Failed to create club: ${clubError?.message || 'Unknown error'}`)
        setLoading(false)
        return
      }

      console.log('✅ Club created successfully:', club.id)

      // 7. Add user as club owner/admin
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          user_id: authUser.id,
          club_id: club.id,
          role: 'admin',
          is_owner: true,
          verified_via_pin: true
        })

      if (membershipError) {
        console.error('Membership creation error:', membershipError)
        toast.error(`Failed to add as admin: ${membershipError.message}`)
        setLoading(false)
        return
      }

      // 8. Update pending_clubs status
      await supabase
        .from('pending_clubs')
        .update({ 
          status: 'verified',
          club_id: club.id,
          used_count: 1,
          first_used_by: authUser.id,
          first_used_at: new Date().toISOString()
        })
        .eq('id', pendingClubId)

      // 9. Update user role to organizer
      await supabase
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', authUser.id)

      // 10. Clear sessionStorage
      sessionStorage.removeItem('pendingClubId')
      sessionStorage.removeItem('pendingBannerFile')

      // 11. Success!
      setVerified(true)
      toast.success("Congratulations! Club created successfully. You are now the club owner!")
      
      // Redirect to Club Selection page
      setTimeout(() => {
        window.location.href = '/dashboard/organizer/select-club'
      }, 2000)

    } catch (error: any) {
      console.error('Error verifying club:', error)
      toast.error(`Failed to verify club: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-2 border-green-200 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Club Verified!
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Your club has been successfully verified. You now have full organizer access.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <p className="text-sm font-semibold text-green-800">
                  🎉 Redirecting to Club Selection...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Card className="border-2 border-indigo-100 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Verify Your Club
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Enter the 8-digit PIN sent to your official club email
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingClubData && pendingClubData.club_data && (
              <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Club Name</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{pendingClubData.club_data.name}</p>
                <p className="text-sm text-slate-500 mt-2">{pendingClubData.official_email}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="pin" className="flex items-center gap-2 text-base font-semibold">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  8-Digit PIN
                </Label>
                <Input
                  id="pin"
                  type="text"
                  placeholder="12345678"
                  value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                required
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Check your email inbox for the PIN
              </p>
            </div>

              <Button
                type="submit"
                disabled={loading || pin.length !== 8}
                className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Verify Club
                  </>
                )}
              </Button>

              <div className="text-center space-y-2 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the PIN?
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="text-indigo-600 hover:text-indigo-700"
                  onClick={() => router.push('/dashboard/organizer/create-club')}
                >
                  Create a new club
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
