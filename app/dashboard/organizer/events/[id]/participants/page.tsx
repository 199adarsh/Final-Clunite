"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  ArrowLeft,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useEventParticipants } from "@/hooks/useEventParticipants"

export default function EventParticipantsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  
  const { 
    participants, 
    eventDetails,
    loading, 
    error, 
    getParticipantsByStatus, 
    getParticipantStats,
    updateParticipantStatus 
  } = useEventParticipants(eventId)

  const stats = getParticipantStats()
  const isTeamEvent = eventDetails?.team_size !== 'solo'

  // Group participants by team for team events
  const groupedParticipants = isTeamEvent 
    ? participants.reduce((groups, participant) => {
        const teamName = participant.team_name || 'No Team'
        if (!groups[teamName]) {
          groups[teamName] = []
        }
        groups[teamName].push(participant)
        return groups
      }, {} as Record<string, typeof participants>)
    : {}

  const toggleTeamExpansion = (teamName: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamName)) {
      newExpanded.delete(teamName)
    } else {
      newExpanded.add(teamName)
    }
    setExpandedTeams(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-green-100 text-green-700 border-green-200"
      case "waitlisted":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      case "attended":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "registered":
        return <CheckCircle className="h-4 w-4" />
      case "waitlisted":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      case "attended":
        return <UserCheck className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.user?.college?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || participant.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // For team events, filter and group the filtered participants
  const filteredGroupedParticipants = isTeamEvent 
    ? filteredParticipants.reduce((groups, participant) => {
        const teamName = participant.team_name || 'No Team'
        if (!groups[teamName]) {
          groups[teamName] = []
        }
        groups[teamName].push(participant)
        return groups
      }, {} as Record<string, typeof participants>)
    : {}

  const handleStatusUpdate = async (participantId: string, newStatus: "registered" | "waitlisted" | "cancelled" | "attended") => {
    const result = await updateParticipantStatus(participantId, newStatus)
    if (!result.success) {
      // Handle error - you might want to show a toast notification here
      console.error("Failed to update participant status:", result.error)
    }
  }

  const exportParticipants = () => {
    if (isTeamEvent) {
      // Team Event CSV Export
      const teamData = Object.entries(filteredGroupedParticipants).map(([teamName, teamMembers]) => {
        const leader = teamMembers[0] // First member is leader
        const members = teamMembers.slice(1) // Rest are members
        
        const row = [
          `"${teamName}"`,
          `"${leader.user?.full_name || ""}"`,
          `"${leader.user?.email || ""}"`,
          `"${leader.user?.college || ""}"`,
          `"${leader.registration_data?.participant_details?.branch || leader.registration_data?.additional_info?.branch || ""}"`,
          `"${leader.user?.phone || ""}"`,
        ]
        
        // Add member details (up to 3 more members for max team size of 4)
        for (let i = 0; i < 3; i++) {
          if (members[i]) {
            row.push(
              `"${members[i].user?.full_name || ""}"`,
              `"${members[i].user?.email || ""}"`,
              `"${members[i].user?.college || ""}"`,
              `"${members[i].registration_data?.participant_details?.branch || members[i].registration_data?.additional_info?.branch || ""}"`,
              `"${members[i].user?.phone || ""}"`
            )
          } else {
            row.push('""', '""', '""', '""', '""') // Empty member slots
          }
        }
        
        row.push(`"${leader.status}"`) // Team status
        return row.join(",")
      })
      
      // Create headers for team CSV
      const teamHeaders = [
        "Team Name", "Leader Name", "Leader Email", "Leader College", "Leader Branch", "Leader Mobile"
      ]
      
      for (let i = 1; i <= 3; i++) {
        teamHeaders.push(`Member${i} Name`, `Member${i} Email`, `Member${i} College`, `Member${i} Branch`, `Member${i} Mobile`)
      }
      teamHeaders.push("Team Status")
      
      const csvContent = [teamHeaders.join(","), ...teamData].join("\n")
      
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `event-teams-${eventId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // Individual Event CSV Export
      const headers = ["Name", "Email", "College", "Branch", "Mobile No", "Status"]
      
      const csvContent = [
        headers.join(","),
        ...filteredParticipants.map(p => [
          `"${p.user?.full_name || ""}"`,
          `"${p.user?.email || ""}"`,
          `"${p.user?.college || ""}"`,
          `"${p.registration_data?.participant_details?.branch || p.registration_data?.additional_info?.branch || ""}"`,
          `"${p.user?.phone || ""}"`,
          `"${p.status}"`
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `event-participants-${eventId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const sendBulkEmail = () => {
    const emails = filteredParticipants
      .filter(p => p.status === "registered" || p.status === "attended")
      .map(p => p.user?.email)
      .filter(Boolean)
      .join(";")
    
    if (emails) {
      window.location.href = `mailto:?bcc=${emails}&subject=Event Update - ${eventId}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading participants: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button - Top Left */}
      <div>
        <Link href="/dashboard/organizer/host">
          <Button variant="outline" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 border-0 shadow-md">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Management Hub
          </Button>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="border-2 border-indigo-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">Event Participants Dashboard</CardTitle>
              <CardDescription className="text-lg mt-2">View and manage participants for all events</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportParticipants} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={sendBulkEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered</p>
                <p className="text-2xl font-bold text-green-600">{stats.registered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Waitlisted</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.waitlisted}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attended</p>
                <p className="text-2xl font-bold text-blue-600">{stats.attended}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Participants List</CardTitle>
              <CardDescription>View and manage all event participants</CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search participants..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {(isTeamEvent ? Object.keys(filteredGroupedParticipants).length === 0 : filteredParticipants.length === 0) ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {participants.length === 0 ? "No Participants Yet" : "No Participants Found"}
                  </h3>
                  <p className="text-gray-600">
                    {participants.length === 0 
                      ? "No one has registered for this event yet. Share your event to get participants!"
                      : "No participants match your current search and filter criteria."
                    }
                  </p>
                  {participants.length === 0 && (
                    <div className="mt-6 space-x-4">
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Share Event
                      </Button>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Participants
                      </Button>
                    </div>
                  )}
                </div>
              ) : isTeamEvent ? (
                // Team Event View - Show teams with expandable members
                <div className="space-y-3">
                  {Object.entries(filteredGroupedParticipants).map(([teamName, teamMembers]) => (
                    <div key={teamName} className="border rounded-lg overflow-hidden">
                      {/* Team Header */}
                      <div 
                        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleTeamExpansion(teamName)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {expandedTeams.has(teamName) ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                            <div className="flex items-center space-x-2">
                              <Users className="h-5 w-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900 text-lg">{teamName}</h3>
                            </div>
                            <Badge variant="secondary">
                              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {teamMembers.map(member => (
                              <Badge key={member.id} className={getStatusColor(member.status)}>
                                {member.status}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Team Members - Expandable */}
                      {expandedTeams.has(teamName) && (
                        <div className="border-t bg-white">
                          {teamMembers.map((participant, index) => (
                            <div key={participant.id} className={`p-4 ${index < teamMembers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <Avatar>
                                    <AvatarImage src={participant.user?.avatar_url || ""} />
                                    <AvatarFallback>
                                      {participant.user?.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h4 className="font-semibold text-gray-900">{participant.user?.full_name}</h4>
                                      <Badge className={getStatusColor(participant.status)}>
                                        <div className="flex items-center space-x-1">
                                          {getStatusIcon(participant.status)}
                                          <span>{participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}</span>
                                        </div>
                                      </Badge>
                                    </div>
                                    
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                      <span className="flex items-center">
                                        <Mail className="h-3 w-3 mr-1" />
                                        {participant.user?.email}
                                      </span>
                                      <span>{participant.user?.college}</span>
                                      <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(participant.registered_at).toLocaleDateString()}
                                      </span>
                                    </div>

                                    {/* Additional Registration Info - Only show relevant details */}
                                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Information:</h5>
                                      <div className="space-y-1 text-xs text-gray-600">
                                        {(participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch) && (
                                          <div>
                                            <span className="font-medium">Branch:</span>
                                            <span className="ml-1">{participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch}</span>
                                          </div>
                                        )}
                                        {participant.registration_data?.additional_info?.specialRequirements && (
                                          <div>
                                            <span className="font-medium">Special Requirements:</span>
                                            <span className="ml-1">{participant.registration_data.additional_info.specialRequirements}</span>
                                          </div>
                                        )}
                                        {participant.registration_data?.additional_info?.dietaryRestrictions && (
                                          <div>
                                            <span className="font-medium">Dietary Restrictions:</span>
                                            <span className="ml-1">{participant.registration_data.additional_info.dietaryRestrictions}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Select
                                    value={participant.status}
                                    onValueChange={(value) => handleStatusUpdate(participant.id, value as any)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="registered">Registered</SelectItem>
                                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                                      <SelectItem value="attended">Attended</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Phone className="h-4 w-4 mr-2" />
                                        View Contact
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Individual Event View - Show all participant details directly
                <div className="space-y-2">
                  {filteredParticipants.map((participant) => (
                    <div key={participant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar>
                            <AvatarImage src={participant.user?.avatar_url || ""} />
                            <AvatarFallback>
                              {participant.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{participant.user?.full_name}</h3>
                              <Badge className={getStatusColor(participant.status)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(participant.status)}
                                  <span>{participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}</span>
                                </div>
                              </Badge>
                            </div>
                            
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {participant.user?.email}
                              </span>
                              <span>{participant.user?.college}</span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(participant.registered_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Additional Registration Info - Only show relevant details */}
                            <div className="bg-gray-50 rounded-lg p-3 mt-2">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information:</h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                {(participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch) && (
                                  <div>
                                    <span className="font-medium">Branch:</span>
                                    <span className="ml-1">{participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch}</span>
                                  </div>
                                )}
                                {participant.registration_data?.additional_info?.specialRequirements && (
                                  <div>
                                    <span className="font-medium">Special Requirements:</span>
                                    <span className="ml-1">{participant.registration_data.additional_info.specialRequirements}</span>
                                  </div>
                                )}
                                {participant.registration_data?.additional_info?.dietaryRestrictions && (
                                  <div>
                                    <span className="font-medium">Dietary Restrictions:</span>
                                    <span className="ml-1">{participant.registration_data.additional_info.dietaryRestrictions}</span>
                                  </div>
                                )}
                                {participant.registration_data?.participant_details?.skills && (
                                  <div>
                                    <span className="font-medium">Skills:</span>
                                    <span className="ml-1">{participant.registration_data.participant_details.skills}</span>
                                  </div>
                                )}
                                {participant.registration_data?.participant_details?.experience && (
                                  <div>
                                    <span className="font-medium">Experience:</span>
                                    <span className="ml-1">{participant.registration_data.participant_details.experience}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={participant.status}
                            onValueChange={(value) => handleStatusUpdate(participant.id, value as any)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Registered</SelectItem>
                              <SelectItem value="waitlisted">Waitlisted</SelectItem>
                              <SelectItem value="attended">Attended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                View Contact
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grid" className="space-y-4">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {participants.length === 0 ? "No Participants Yet" : "No Participants Found"}
                  </h3>
                  <p className="text-gray-600">
                    {participants.length === 0 
                      ? "No one has registered for this event yet. Share your event to get participants!"
                      : "No participants match your current search and filter criteria."
                    }
                  </p>
                  {participants.length === 0 && (
                    <div className="mt-6 space-x-4">
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Share Event
                      </Button>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Participants
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredParticipants.map((participant) => (
                    <Card key={participant.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar>
                            <AvatarImage src={participant.user?.avatar_url || ""} />
                            <AvatarFallback>
                              {participant.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{participant.user?.full_name}</h3>
                            <p className="text-xs text-gray-600">{participant.user?.college}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Badge className={getStatusColor(participant.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(participant.status)}
                              <span>{participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}</span>
                            </div>
                          </Badge>
                          <p className="text-xs text-gray-600">{participant.user?.email}</p>
                          {participant.team_name && (
                            <p className="text-xs text-gray-600">Team: {participant.team_name}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Registered: {new Date(participant.registered_at).toLocaleDateString()}
                          </p>
                          
                          {/* Additional Info for Grid View */}
                          <div className="bg-gray-50 rounded p-2 mt-2">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Additional Info:</h5>
                            <div className="space-y-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                              {(participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch) && (
                                <div>
                                  <span className="font-medium">Branch:</span>
                                  <span className="ml-1">{participant.registration_data?.participant_details?.branch || participant.registration_data?.additional_info?.branch}</span>
                                </div>
                              )}
                              {participant.registration_data?.additional_info?.specialRequirements && (
                                <div>
                                  <span className="font-medium">Special Requirements:</span>
                                  <span className="ml-1">{participant.registration_data.additional_info.specialRequirements}</span>
                                </div>
                              )}
                              {participant.registration_data?.additional_info?.dietaryRestrictions && (
                                <div>
                                  <span className="font-medium">Dietary:</span>
                                  <span className="ml-1">{participant.registration_data.additional_info.dietaryRestrictions}</span>
                                </div>
                              )}
                              {participant.registration_data?.participant_details?.skills && (
                                <div>
                                  <span className="font-medium">Skills:</span>
                                  <span className="ml-1">{participant.registration_data.participant_details.skills}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
