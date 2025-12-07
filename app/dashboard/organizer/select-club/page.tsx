"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Calendar, ArrowRight, Loader2, Crown, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function SelectClubPage() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authUser) {
      loadUserClubs()
    }
  }, [authUser])

  const loadUserClubs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('user_id', authUser!.id)
        .eq('role', 'admin')

      if (error) throw error

      const userClubs = (data || []).map((m: any) => ({
        ...m.club,
        is_owner: m.is_owner
      }))

      setClubs(userClubs)

      // Auto-select first club and redirect immediately
      if (userClubs.length > 0) {
        const firstClub = userClubs[0]
        sessionStorage.setItem('selectedClubId', firstClub.id)
        sessionStorage.setItem('selectedClubName', firstClub.name)
        
        // Redirect to Event Management Hub
        router.push('/dashboard/organizer/host')
      }
    } catch (err: any) {
      console.error('Error loading clubs:', err)
      toast.error('Failed to load clubs')
      setLoading(false)
    }
  }

  const selectClub = (clubId: string, clubName: string) => {
    // Store selected club in session
    sessionStorage.setItem('selectedClubId', clubId)
    sessionStorage.setItem('selectedClubName', clubName)
    
    // Redirect to Event Management Hub
    router.push('/dashboard/organizer/host')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (clubs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-900">No Clubs Found</h2>
            <p className="text-yellow-800">
              You are not an admin of any clubs yet. Create a club or verify with a PIN to get started.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/dashboard/organizer/create-club">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Create Your First Club
                </Button>
              </Link>
              <Link href="/dashboard/organizer/verify-club">
                <Button variant="outline" className="w-full">
                  Verify with PIN
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Select Your Club
          </h1>
          <p className="text-gray-600 text-lg">
            Choose which club you want to manage
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <Card
              key={club.id}
              className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 hover:border-indigo-300"
              onClick={() => selectClub(club.id, club.name)}
            >
              <CardHeader className="space-y-4">
                {/* Club Banner/Icon */}
                <div className="h-32 -mx-6 -mt-6 mb-2 rounded-t-lg relative overflow-hidden">
                  {club.banner_url ? (
                    <>
                      <img 
                        src={club.banner_url} 
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <div className="text-6xl font-bold text-white">
                        {club.name.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  {/* Owner Badge */}
                  {club.is_owner && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Club Info */}
                <div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                    {club.name}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {club.description || 'No description'}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{club.members_count || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{club.events_hosted_count || 0} events</span>
                  </div>
                </div>

                {/* Category Badge */}
                <Badge variant="secondary" className="w-full justify-center">
                  {club.category}
                </Badge>

                {/* Select Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 group-hover:shadow-lg transition-all"
                  onClick={() => selectClub(club.id, club.name)}
                >
                  Manage This Club
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-2 border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-indigo-900">Club-Specific Management</h3>
                <p className="text-sm text-indigo-700">
                  Each club has its own Event Management Hub with separate events, participants, and analytics. 
                  Select a club to manage its events and view its data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
