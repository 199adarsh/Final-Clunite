"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Crown, UserPlus, Trash2, Mail, AlertCircle, Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ManageAdminsPage() {
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userClubs, setUserClubs] = useState<any[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>("")
  const [admins, setAdmins] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (authUser) {
      loadUserClubs()
    }
  }, [authUser])

  useEffect(() => {
    if (selectedClubId) {
      loadClubAdmins()
    }
  }, [selectedClubId])

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

      setUserClubs((data || []).map((m: any) => m.club))
      if (data && data.length > 0) {
        setSelectedClubId(data[0].club_id)
      }
    } catch (err: any) {
      console.error('Error loading clubs:', err)
      toast.error('Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }

  const loadClubAdmins = async () => {
    try {
      setLoading(true)
      
      // Check if current user is owner
      const { data: myMembership } = await supabase
        .from('club_memberships')
        .select('is_owner')
        .eq('user_id', authUser!.id)
        .eq('club_id', selectedClubId)
        .single()

      setIsOwner(myMembership?.is_owner || false)

      // Load all admins
      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          *,
          user:users(*)
        `)
        .eq('club_id', selectedClubId)
        .eq('role', 'admin')
        .order('is_owner', { ascending: false })
        .order('joined_at', { ascending: true })

      if (error) {
        console.error('Error loading admins:', error)
        throw error
      }

      console.log('Loaded admins:', data)
      setAdmins(data || [])
    } catch (err: any) {
      console.error('Error loading admins:', err)
      toast.error('Failed to load admins')
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

    // Check if already at max (5 admins)
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

      // Check if already an admin
      const existing = admins.find(a => a.user_id === userData.id)
      if (existing) {
        toast.error('User is already an admin of this club')
        setAdding(false)
        return
      }

      // Add as admin
      const { error: addError } = await supabase
        .from('club_memberships')
        .insert({
          user_id: userData.id,
          club_id: selectedClubId,
          role: 'admin',
          is_owner: false,
          verified_via_pin: false,
          invited_by: authUser!.id,
          invited_at: new Date().toISOString()
        })

      if (addError) throw addError

      // Update user role to organizer
      await supabase
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', userData.id)

      toast.success(`${userData.full_name || newAdminEmail} added as admin!`)
      setNewAdminEmail('')
      loadClubAdmins()
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

    if (!confirm(`Remove ${adminName} as admin?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('user_id', adminId)
        .eq('club_id', selectedClubId)

      if (error) throw error

      toast.success(`${adminName} removed as admin`)
      loadClubAdmins()
    } catch (err: any) {
      console.error('Error removing admin:', err)
      toast.error('Failed to remove admin')
    }
  }

  if (loading && userClubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (userClubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <p className="text-yellow-900 font-medium mb-2">You are not an admin of any clubs</p>
              <p className="text-yellow-700 text-sm mb-4">Create a club or verify with a PIN first</p>
              <Link href="/dashboard/organizer/create-club">
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Create Your First Club
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const selectedClub = userClubs.find(c => c.id === selectedClubId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 backdrop-blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 backdrop-blur-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-4xl font-black">Manage Admins</h1>
                </div>
                <p className="text-emerald-50 text-lg">Add or remove club administrators for {selectedClub?.name}</p>
              </div>
              <Link href="/dashboard/organizer/host">
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl backdrop-blur-sm hover:scale-105 transition-all duration-300">
                  Back to Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Club Selector */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Shield className="h-5 w-5" />
              Select Club
            </CardTitle>
            <CardDescription>Choose which club to manage administrators</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger className="w-full h-12 border-2 border-emerald-200 focus:border-emerald-500">
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {userClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Owner Status */}
        {!isOwner && (
          <Alert className="border-2 border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-900 font-medium">
              You are an admin but not the owner. Only the owner can add/remove admins.
            </AlertDescription>
          </Alert>
        )}

        {/* Add Admin (Owner Only) */}
        {isOwner && admins.length < 5 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <UserPlus className="h-5 w-5" />
                Add New Admin
              </CardTitle>
              <CardDescription>
                Invite someone to be an admin ({admins.length}/5 slots used)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="newAdminEmail" className="sr-only">Email</Label>
                  <Input
                    id="newAdminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  onClick={handleAddAdmin}
                  disabled={adding || !newAdminEmail}
                  className="h-12 px-6"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                User must have an account on Clunite first
              </p>
            </CardContent>
          </Card>
        )}

        {/* Admins List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Admins ({admins.length}/5)
            </CardTitle>
            <CardDescription>
              People who can manage {selectedClub?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No admins found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Added</TableHead>
                    {isOwner && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.user?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {admin.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.is_owner ? (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {admin.verified_via_pin ? 'Via PIN' : 'Invited'}
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          {!admin.is_owner && admin.user_id !== authUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdmin(admin.user_id, admin.user?.full_name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-900">
                <p className="font-medium mb-1">Admin Permissions:</p>
                <ul className="list-disc list-inside space-y-1 text-indigo-800">
                  <li>Create and manage events for the club</li>
                  <li>View participant data and statistics</li>
                  <li>Access organizer dashboard</li>
                  <li>Only the owner can add/remove other admins</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
