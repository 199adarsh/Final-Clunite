"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
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
  ChevronRight,
  QrCode,
  Loader2
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

  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanDuplicate, setScanDuplicate] = useState<string | null>(null)
  const [scanLog, setScanLog] = useState<{ name: string; time: string; type: 'success' | 'error' | 'duplicate' }[]>([])

  // Web Audio sound helpers (no dependency)
  const playBeep = (type: 'success' | 'error' | 'duplicate') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'duplicate') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio not supported, silently skip
    }
  };

  const checkedInCount = participants.filter(p => p.status === 'attended').length;
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isScannerOpen) return;

    let html5QrcodeScanner: any = null;
    const scriptId = 'html5-qrcode-script';

    const startScanner = () => {
      try {
        const Html5QrcodeScanner = (window as any).Html5QrcodeScanner;
        if (!Html5QrcodeScanner) {
          console.error("Html5QrcodeScanner library not loaded on window");
          return;
        }

        html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        html5QrcodeScanner.render(
          async (decodedText: string) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const processParticipant = async (participant: any) => {
              if (participant.status === 'attended') {
                playBeep('duplicate');
                const dupMsg = `${participant.user?.full_name || 'Participant'}`;
                setScanDuplicate(dupMsg);
                setScanResult(null);
                setScanError(null);
                setScanLog(prev => [{ name: participant.user?.full_name || 'Participant', time: now, type: 'duplicate' }, ...prev.slice(0, 4)]);
                setTimeout(() => {
                  setScanDuplicate(null);
                  isProcessingRef.current = false;
                }, 2000);
                return;
              }

              const res = await updateParticipantStatus(participant.id, 'attended');
              if (res.success) {
                playBeep('success');
                const msg = `${participant.user?.full_name || 'Participant'}`;
                setScanResult(msg);
                setScanDuplicate(null);
                setScanError(null);
                setScanLog(prev => [{ name: participant.user?.full_name || 'Participant', time: now, type: 'success' }, ...prev.slice(0, 4)]);
                setTimeout(() => {
                  setScanResult(null);
                  isProcessingRef.current = false;
                }, 2000);
              } else {
                playBeep('error');
                setScanError(`Database error: ${res.error || 'Check-in failed'}`);
                setScanLog(prev => [{ name: 'DB Error', time: now, type: 'error' }, ...prev.slice(0, 4)]);
                setTimeout(() => {
                  setScanError(null);
                  isProcessingRef.current = false;
                }, 2500);
              }
            };

            try {
              let regId: string | null = null;
              let userId: string | null = null;

              if (decodedText.startsWith("clunite:reg:")) {
                regId = decodedText.replace("clunite:reg:", "").trim();
              } else if (decodedText.startsWith("clunite:profile:")) {
                userId = decodedText.replace("clunite:profile:", "").trim();
              } else if (decodedText.includes("http")) {
                try {
                  const url = new URL(decodedText);
                  regId = url.searchParams.get("reg") || url.searchParams.get("id");
                  userId = url.searchParams.get("user") || url.searchParams.get("userId");
                } catch {
                  regId = decodedText.trim();
                }
              } else {
                regId = decodedText.trim();
              }

              let participant = participants.find(p => 
                (regId && (p.id === regId || p.id.startsWith(`${regId}_`))) ||
                (userId && p.user_id === userId)
              );

              // Supabase Live Fallback lookup if not preloaded in memory
              if (!participant && (regId || userId)) {
                let query = supabase.from("event_registrations").select("*, user:users(*)").eq("event_id", eventId);
                if (regId) query = query.eq("id", regId);
                else if (userId) query = query.eq("user_id", userId);

                const { data: fallbackReg } = await query.maybeSingle();
                if (fallbackReg) {
                  participant = fallbackReg;
                }
              }

              if (participant) {
                await processParticipant(participant);
              } else {
                playBeep('error');
                setScanError("QR Code not registered for this event.");
                setScanLog(prev => [{ name: 'Unregistered QR', time: now, type: 'error' }, ...prev.slice(0, 4)]);
                setTimeout(() => {
                  setScanError(null);
                  isProcessingRef.current = false;
                }, 2500);
              }
            } catch (err: any) {
              console.error("Scan processing error:", err);
              playBeep('error');
              setScanError("Failed to parse ticket data.");
              setTimeout(() => {
                setScanError(null);
                isProcessingRef.current = false;
              }, 2500);
            }
          },
          (_errorMessage: string) => { /* quiet scan frames */ }
        );
        setIsScanning(true);
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        setScanError(`Camera access error: ${err.message || err}`);
      }
    };

    if (!(window as any).Html5QrcodeScanner) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      script.onload = () => { setTimeout(startScanner, 200); };
      document.body.appendChild(script);
    } else {
      startScanner();
    }

    return () => {
      if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear().catch((err: any) => console.log("Clean error:", err)); } catch (e) { console.log("Cleanup error:", e); }
      }
      setIsScanning(false);
      isProcessingRef.current = false;
    };
  }, [isScannerOpen, eventId, participants]);

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
          `"${(leader.user as any)?.phone || ""}"`,
        ]
        
        // Add member details (up to 3 more members for max team size of 4)
        for (let i = 0; i < 3; i++) {
          if (members[i]) {
            row.push(
              `"${members[i].user?.full_name || ""}"`,
              `"${members[i].user?.email || ""}"`,
              `"${members[i].user?.college || ""}"`,
              `"${members[i].registration_data?.participant_details?.branch || members[i].registration_data?.additional_info?.branch || ""}"`,
              `"${(members[i].user as any)?.phone || ""}"`
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
          `"${(p.user as any)?.phone || ""}"`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Back Button - Top Left */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/organizer/host">
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 shadow-sm rounded-xl hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Host Dashboard
          </Button>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="border-0 shadow-md bg-white rounded-2xl p-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">Event Participants</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-2 py-1">
                Live Turnout
              </Badge>
            </div>
            <p className="text-slate-600 mt-2 font-medium">
              View registrations, check attendance records, and manage participant data for your events.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={() => setIsScannerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-semibold">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Tickets
            </Button>
            <Button onClick={exportParticipants} variant="outline" className="bg-white border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 font-semibold">
              <Download className="h-4 w-4 mr-2 text-slate-500" />
              Export CSV
            </Button>
            <Button onClick={sendBulkEmail} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-semibold">
              <Mail className="h-4 w-4 mr-2" />
              Send Bulk Email
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Registered</p>
                <p className="text-3xl font-black text-emerald-600">{stats.registered}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Waitlisted</p>
                <p className="text-3xl font-black text-amber-600">{stats.waitlisted}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Attended</p>
                <p className="text-3xl font-black text-blue-600">{stats.attended}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Cancelled</p>
                <p className="text-3xl font-black text-red-600">{stats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants List */}
      <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Participants List</CardTitle>
              <CardDescription className="text-slate-500 font-medium">View and manage all registered event participants</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input 
                  placeholder="Search participants..." 
                  className="pl-10 w-64 bg-slate-50/80 border-slate-200 focus:bg-white rounded-xl transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-slate-50/80 border-slate-200 rounded-xl">
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
        <CardContent className="p-8">
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
              <TabsTrigger value="list" className="rounded-lg font-semibold px-4 py-2">List View</TabsTrigger>
              <TabsTrigger value="grid" className="rounded-lg font-semibold px-4 py-2">Grid View</TabsTrigger>
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
                    <div key={teamName} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                      {/* Team Header */}
                      <div 
                        className="bg-slate-50/50 p-5 cursor-pointer hover:bg-slate-100/60 transition-colors"
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
                                     <div className="bg-slate-50/60 rounded-xl p-4 mt-3 border border-slate-100/50">
                                      <h5 className="text-sm font-semibold text-slate-700 mb-2">Additional Information:</h5>
                                      <div className="space-y-1 text-xs text-slate-600">
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
                                      
                                      {/* Dynamic custom questions responses */}
                                      {participant.registration_data?.additional_info?.custom_responses && Object.keys(participant.registration_data.additional_info.custom_responses).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                          <span className="font-bold text-slate-700 block mb-2 text-xs">Custom Form Responses:</span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.entries(participant.registration_data.additional_info.custom_responses).map(([qId, val]: [string, any]) => {
                                              const questionLabel = eventDetails?.contact_info?.custom_questions?.find((q: any) => q.id === qId)?.label || `Question (${qId})`;
                                              return (
                                                <div key={qId} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-sm">
                                                  <span className="font-medium text-slate-400 block text-[9px] uppercase tracking-wide">{questionLabel}</span>
                                                  <span className="text-slate-800 font-semibold text-xs">{val === 'true' ? 'Yes' : val === 'false' ? 'No' : val}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
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
                              
                              {/* Dynamic custom questions responses */}
                              {participant.registration_data?.additional_info?.custom_responses && Object.keys(participant.registration_data.additional_info.custom_responses).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <span className="font-bold text-slate-700 block mb-2 text-xs">Custom Form Responses:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.entries(participant.registration_data.additional_info.custom_responses).map(([qId, val]: [string, any]) => {
                                      const questionLabel = eventDetails?.contact_info?.custom_questions?.find((q: any) => q.id === qId)?.label || `Question (${qId})`;
                                      return (
                                        <div key={qId} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                          <span className="font-medium text-slate-400 block text-[9px] uppercase tracking-wide">{questionLabel}</span>
                                          <span className="text-slate-800 font-semibold text-xs">{val === 'true' ? 'Yes' : val === 'false' ? 'No' : val}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {participant.status !== 'attended' ? (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(participant.id, 'attended')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-8 px-3 flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Check-in</span>
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Attended
                            </Badge>
                          )}
                          <Select
                            value={participant.status}
                            onValueChange={(value) => handleStatusUpdate(participant.id, value as any)}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
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
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            {participant.status !== 'attended' ? (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(participant.id, 'attended')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-8 flex items-center justify-center gap-1 shadow-sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Check-in Attendee</span>
                              </Button>
                            ) : (
                              <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold h-8 flex items-center justify-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Attendance Verified</span>
                              </div>
                            )}
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

      {/* SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-black/5 animate-in zoom-in-95 duration-200">

            {/* Modal Header with live counter */}
            <div className="bg-indigo-600 text-white p-5 flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 animate-pulse" /> QR Check-in Scanner
                </h3>
                <p className="text-indigo-100 text-xs">Point camera at a student&apos;s ticket or profile badge</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Live attendance counter */}
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[70px]">
                  <p className="text-2xl font-black leading-none">{checkedInCount}</p>
                  <p className="text-indigo-100 text-[10px] font-medium">/ {participants.length} in</p>
                </div>
                <button
                  onClick={() => { setIsScannerOpen(false); setScanResult(null); setScanError(null); setScanDuplicate(null); }}
                  className="text-white/70 hover:text-white text-2xl font-bold outline-none leading-none mt-1"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Floating Alert Notification */}
              {scanResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="h-9 w-9 shrink-0 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-emerald-800 text-xs">Checked In</p>
                    <p className="text-emerald-700 font-bold text-sm truncate">{scanResult}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Ready for next
                  </span>
                </div>
              )}

              {scanDuplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="h-9 w-9 shrink-0 bg-amber-400 text-white rounded-full flex items-center justify-center shadow">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-amber-800 text-xs">Already Checked In</p>
                    <p className="text-amber-700 font-semibold text-sm truncate">{scanDuplicate}</p>
                  </div>
                </div>
              )}

              {scanError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="h-9 w-9 shrink-0 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-red-800 text-xs">Scan Notice</p>
                    <p className="text-red-600 text-xs truncate">{scanError}</p>
                  </div>
                </div>
              )}

              {/* Continuous Camera Viewfinder */}
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-slate-50 relative aspect-square max-w-[260px] mx-auto flex items-center justify-center shadow-inner">
                  <div id="qr-reader" className="w-full h-full"></div>
                  {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <p className="text-xs text-muted-foreground">Starting camera...</p>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground font-medium">
                  Continuous rapid mode active · Point camera at student ticket
                </p>
              </div>

              {/* Scan History Log */}
              {scanLog.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Scans</p>
                  <div className="space-y-1.5">
                    {scanLog.map((entry, i) => (
                      <div key={i} className={`flex items-center gap-2.5 p-2 rounded-xl text-xs ${
                        entry.type === 'success' ? 'bg-emerald-50' :
                        entry.type === 'duplicate' ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                        <span className={`h-5 w-5 shrink-0 flex items-center justify-center rounded-full text-white ${
                          entry.type === 'success' ? 'bg-emerald-500' :
                          entry.type === 'duplicate' ? 'bg-amber-400' : 'bg-red-400'
                        }`}>
                          {entry.type === 'success' ? '✓' : entry.type === 'duplicate' ? '↩' : '✗'}
                        </span>
                        <span className={`font-semibold flex-1 ${
                          entry.type === 'success' ? 'text-emerald-800' :
                          entry.type === 'duplicate' ? 'text-amber-800' : 'text-red-700'
                        }`}>{entry.name}</span>
                        <span className="text-slate-400 shrink-0">{entry.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
