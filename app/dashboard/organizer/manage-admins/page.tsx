"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Crown, UserPlus, Trash2, Mail, AlertCircle, Loader2, Shield, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ManageAdminsPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentClub, setCurrentClub] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (authUser) {
      loadCurrentClub()
    }
  }, [authUser])

  const loadCurrentClub = async () => {
    try {
      setLoading(true)
      
      const storedClubId = sessionStorage.getItem('selectedClubId')
      if (!storedClubId) {
        toast.error('No club selected. Please select a club first.')
        router.push('/dashboard/organizer/host')
        return
      }

      // Load membership of current user
      const { data: membership, error: membershipError } = await supabase
        .from('club_memberships')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('user_id', authUser!.id)
        .eq('club_id', storedClubId)
        .eq('role', 'admin')
        .single()

      if (membershipError || !membership) {
        toast.error('You are not an admin of this club')
        router.push('/dashboard/organizer/host')
        return
      }

      setCurrentClub(membership.club)
      setIsOwner(membership.is_owner || false)
      
      // Load all admins for this club
      await loadClubAdmins(storedClubId)
    } catch (err: any) {
      console.error('Error loading club:', err)
      toast.error('Failed to load club data')
      setLoading(false)
    }
  }

  const loadClubAdmins = async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          *,
          user:users!club_memberships_user_id_fkey(*)
        `)
        .eq('club_id', clubId)
        .eq('role', 'admin')
        .order('is_owner', { ascending: false })
        .order('joined_at', { ascending: true })

      if (error) throw error
      setAdmins(data || [])
    } catch (err: any) {
      console.error('Error loading admins:', err)
      toast.error('Failed to load admins list')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address')
      return
    }

    if (!isOwner) {
      toast.error('Only the club owner can add admins')
      return
    }

    if (admins.length >= 5) {
      toast.error('Maximum 5 admins allowed per club')
      return
    }

    try {
      setAdding(true)

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', newAdminEmail.toLowerCase())
        .single()

      if (userError || !userData) {
        toast.error('User not found. They must sign up first.')
        setAdding(false)
        return
      }

      const clubId = sessionStorage.getItem('selectedClubId')
      if (!clubId) return

      // Check if already has any membership
      const { data: existingMembership, error: fetchErr } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('user_id', userData.id)
        .eq('club_id', clubId)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      if (existingMembership) {
        if (existingMembership.role === 'admin') {
          toast.error('User is already an admin')
          setAdding(false)
          return
        }

        // Upgrade membership to admin
        const { error: updateError } = await supabase
          .from('club_memberships')
          .update({
            role: 'admin',
            is_owner: false,
            invited_by: authUser!.id,
            invited_at: new Date().toISOString()
          })
          .eq('id', existingMembership.id)

        if (updateError) throw updateError
      } else {
        // Insert new membership
        const { error: addError } = await supabase
          .from('club_memberships')
          .insert({
            user_id: userData.id,
            club_id: clubId,
            role: 'admin',
            is_owner: false,
            verified_via_pin: false,
            invited_by: authUser!.id,
            invited_at: new Date().toISOString()
          })

        if (addError) throw addError
      }

      // Upgrade user role to organizer if they were a student
      await supabase
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', userData.id)

      toast.success(`${userData.full_name || newAdminEmail} added as admin!`)
      setNewAdminEmail('')
      loadClubAdmins(clubId)
    } catch (err: any) {
      console.error('Error adding admin:', err)
      toast.error('Failed to add admin')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    if (!isOwner) {
      toast.error('Only the club owner can remove admins')
      return
    }

    if (!confirm(`Are you sure you want to remove ${adminName} as admin?`)) {
      return
    }

    const clubId = sessionStorage.getItem('selectedClubId')
    if (!clubId) return

    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('user_id', adminId)
        .eq('club_id', clubId)

      if (error) throw error

      toast.success(`${adminName} removed as admin`)
      loadClubAdmins(clubId)
    } catch (err: any) {
      console.error('Error removing admin:', err)
      toast.error('Failed to remove admin')
    }
  }

  const handleTransferOwnership = async (targetUserId: string, targetUserName: string) => {
    if (!isOwner) {
      toast.error('Only the club owner can transfer ownership')
      return
    }

    if (!confirm(`Are you sure you want to transfer club ownership to ${targetUserName}? You will become a regular admin and lose owner privileges.`)) {
      return
    }

    const clubId = sessionStorage.getItem('selectedClubId')
    if (!clubId) return

    try {
      setLoading(true)

      // Step 1: Remove owner status from current user
      const { error: err1 } = await supabase
        .from('club_memberships')
        .update({ is_owner: false })
        .eq('user_id', authUser!.id)
        .eq('club_id', clubId)

      if (err1) throw err1

      // Step 2: Grant owner status to target user
      const { error: err2 } = await supabase
        .from('club_memberships')
        .update({ is_owner: true })
        .eq('user_id', targetUserId)
        .eq('club_id', clubId)

      if (err2) throw err2

      // Step 3: Update club's created_by to target user
      const { error: err3 } = await supabase
        .from('clubs')
        .update({ created_by: targetUserId })
        .eq('id', clubId)

      if (err3) throw err3

      toast.success(`Ownership has been successfully transferred to ${targetUserName}`)
      
      // Update local states
      setIsOwner(false)
      loadCurrentClub()
    } catch (err: any) {
      console.error('Error transferring ownership:', err)
      toast.error('Failed to transfer ownership')
      setLoading(false)
    }
  }

  // Loading Screen
  if (loading && !currentClub) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading administrator details...</p>
        </div>
      </div>
    )
  }

  // Owner Access Enforcement Screen
  if (!loading && !isOwner) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white rounded-2xl text-center overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-8 space-y-6">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Shield className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Owner Access Required</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Only the club owner has permission to manage administrators and transfer ownership for this club.
              </p>
            </div>
            <Link href="/dashboard/organizer/host" className="block">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                Back to Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-8">
      {/* Header card with glassmorphism header & colorful gradients */}
      <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Manage Admins</h1>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold border-amber-200 capitalize">
              <Crown className="h-3.5 w-3.5 mr-1" /> Owner View
            </Badge>
          </div>
          <p className="text-gray-600 font-medium">
            Add, remove, or transfer club ownership for <span className="text-indigo-600 font-bold">{currentClub?.name}</span>.
          </p>
        </div>
        <Link href="/dashboard/organizer/host">
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl px-5 py-2.5 font-semibold text-slate-700 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Add Admin Form */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                Add Administrator
              </CardTitle>
              <CardDescription className="text-xs">
                Slots used: <span className="font-bold text-slate-800">{admins.length}/5</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newAdminEmail" className="text-xs font-bold text-slate-700">User Email Address</Label>
                <div className="relative">
                  <Input
                    id="newAdminEmail"
                    type="email"
                    placeholder="e.g. user@college.edu"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="pl-9 h-11 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Note: The user must already have registered an account on Clunite.
                </p>
              </div>

              <Button
                onClick={handleAddAdmin}
                disabled={adding || !newAdminEmail || admins.length >= 5}
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Admin...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Info details */}
          <Card className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3">
            <div className="flex gap-2">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-indigo-900">Admin Privileges</h4>
                <ul className="text-xs text-indigo-800 list-disc list-inside space-y-1.5 leading-relaxed">
                  <li>Can host, schedule, and publish events.</li>
                  <li>Can access real-time event analytics.</li>
                  <li>Can track participant check-ins via QR.</li>
                  <li className="font-semibold text-indigo-900">Only the Owner can invite admins, remove admins, or transfer ownership.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Table of Admins */}
        <div className="md:col-span-2">
          <Card className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Current Administrators
              </CardTitle>
              <CardDescription className="text-xs">
                List of registered admins for this club
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {admins.map((admin) => {
                  const user = admin.user;
                  const adminInitials = (user?.full_name || 'Admin')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div key={admin.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/20 transition">
                      {/* Left: User identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                          {adminInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{user?.full_name || 'Anonymous User'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {user?.id.slice(0, 8)}...</p>
                        </div>
                      </div>

                      {/* Middle: Email & Role Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1 justify-start md:justify-center min-w-0">
                        <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">{user?.email}</span>
                        </div>

                        <div className="shrink-0">
                          {admin.is_owner ? (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-500 text-white font-semibold border-none rounded-full px-2.5 py-0.5">
                              <Crown className="h-3 w-3 mr-1" />
                              Owner
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none rounded-full px-2.5 py-0.5">
                              <Shield className="h-3 w-3 mr-1 text-slate-500" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 justify-end shrink-0">
                        {/* Transfer Ownership Button */}
                        {!admin.is_owner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTransferOwnership(admin.user_id, user?.full_name)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1 h-8 rounded-lg"
                            title="Transfer ownership of the club to this user"
                          >
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                            Make Owner
                          </Button>
                        )}
                        
                        {/* Remove Admin Button */}
                        {!admin.is_owner && admin.user_id !== authUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.user_id, user?.full_name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg flex items-center justify-center"
                            title="Remove admin rights"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
