"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Calendar,
  BarChart3,
  Plus,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  Target,
  ChevronDown,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HostEventPage() {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    attendanceRate: 0,
    engagementRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get selected club from session
    const clubId = sessionStorage.getItem('selectedClubId')
    const clubName = sessionStorage.getItem('selectedClubName')
    
    if (!clubId || !clubName) {
      // No club selected, redirect to club selection
      router.push('/dashboard/organizer/select-club')
      return
    }
    
    setSelectedClubId(clubId)
    setSelectedClubName(clubName)
    fetchClubStats(clubId)
  }, [])

  const fetchClubStats = async (clubId: string) => {
    try {
      setLoading(true)
      
      // Fetch events for this club
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, current_participants')
        .eq('club_id', clubId)
      
      if (eventsError) throw eventsError
      
      const eventIds = events?.map((e: any) => e.id) || []
      
      // Fetch registrations for these events
      let registrations: any[] = []
      let attendedCount = 0
      
      if (eventIds.length > 0) {
        const { data: regs, error: regsError } = await supabase
          .from('event_registrations')
          .select('id, status')
          .in('event_id', eventIds)
        
        if (!regsError && regs) {
          registrations = regs
          attendedCount = regs.filter((r: any) => r.status === 'attended').length
        }
      }
      
      const totalEvents = events?.length || 0
      const totalRegistrations = registrations.length
      const attendanceRate = totalRegistrations > 0 
        ? Math.round((attendedCount / totalRegistrations) * 100) 
        : 0
      const engagementRate = totalEvents > 0 && totalRegistrations > 0
        ? Math.round((totalRegistrations / totalEvents) * 10)
        : 0
      
      setStats({
        totalEvents,
        totalRegistrations,
        attendanceRate,
        engagementRate: Math.min(engagementRate, 100),
      })
    } catch (error) {
      console.error('Error fetching club stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                <Building2 className="h-3 w-3 mr-1" />
                {selectedClubName}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Event Management Hub</h1>
            <p className="text-gray-600 mt-2">
              Create engaging events and track your success with powerful analytics
            </p>
          </div>
          <Link href="/dashboard/organizer/manage-admins">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Users className="h-5 w-5 mr-2" />
              Manage Admins
            </Button>
          </Link>
        </div>

        {/* Colorful Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              icon: Calendar, 
              label: "Total Events", 
              value: loading ? "..." : stats.totalEvents.toString(), 
              trend: "+18%",
              desc: "Events hosted",
              gradient: "from-blue-500 to-blue-600",
            },
            { 
              icon: Users, 
              label: "Registrations", 
              value: loading ? "..." : stats.totalRegistrations.toString(), 
              trend: "+5%",
              desc: "Sign-ups received",
              gradient: "from-purple-500 to-purple-600",
            },
            { 
              icon: TrendingUp, 
              label: "Attendance", 
              value: loading ? "..." : `${stats.attendanceRate}%`, 
              trend: "+8%",
              desc: "Average rate",
              gradient: "from-green-500 to-green-600",
            },
            { 
              icon: Award, 
              label: "Engagement", 
              value: loading ? "..." : `${stats.engagementRate}%`, 
              trend: "-2%",
              desc: "Interaction level",
              gradient: "from-orange-500 to-orange-600",
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`border-none shadow-md bg-gradient-to-br ${stat.gradient} text-white`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    stat.trend.startsWith('+') ? 'bg-white/30' : 'bg-white/20'
                  }`}>{stat.trend}</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-white/90">{stat.label}</p>
                  <p className="text-xs text-white/70 mt-1">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards - elevated, modern, with subtle animated accents */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Host New Event Card */}
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 h-full group">
            {/* decorative gradient blob */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-orange-200 to-pink-200 opacity-40 group-hover:opacity-60 blur-2xl transition-opacity" />
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <Link href="/dashboard/organizer/host/create">
                  <Button size="sm" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-xl shadow-sm">
                    Quick Start
                  </Button>
                </Link>
              </div>
              
              <div className="mb-10">
                <div className="text-5xl mb-4 text-gray-300 font-serif">"</div>
                <h3 className="text-3xl font-light text-gray-900 leading-tight mb-6">
                  Host New Event
                </h3>
                <p className="text-base text-gray-600 leading-relaxed min-h-[72px]">
                  Create engaging events for your campus community. Set up workshops, competitions, seminars, and more with our comprehensive event creation tools.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="border-t border-gray-100 pt-8">
              <div className="grid grid-cols-2 gap-x-8 mb-10">
                <div>
                  <div className="text-5xl font-light text-orange-500 mb-2">5 min</div>
                  <div className="text-sm text-gray-600">Quick setup time</div>
                </div>
                <div>
                  <div className="text-5xl font-light text-orange-500 mb-2">100%</div>
                  <div className="text-sm text-gray-600">Digital workflow</div>
                </div>
              </div>
              
              <Link href="/dashboard/organizer/host/create" className="inline-flex items-center text-gray-900 hover:text-orange-600 transition-colors group">
                <div className="w-12 h-12 rounded-full border-2 border-gray-900 flex items-center justify-center mr-3 group-hover:border-orange-500 group-hover:bg-orange-50 transition-all shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-base font-normal">Create New Event</span>
              </Link>
            </CardContent>
          </Card>

          {/* Organizers Panel Card */}
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 h-full group">
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-200 to-sky-200 opacity-40 group-hover:opacity-60 blur-2xl transition-opacity" />
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <Link href="/dashboard/organizer/host/analytics">
                  <Button size="sm" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-xl shadow-sm">
                    View Now
                  </Button>
                </Link>
              </div>
              
              <div className="mb-10">
                <div className="text-5xl mb-4 text-gray-300 font-serif">"</div>
                <h3 className="text-3xl font-light text-gray-900 leading-tight mb-6">
                  Organizers Panel
                </h3>
                <p className="text-base text-gray-600 leading-relaxed min-h-[72px]">
                  Comprehensive analytics dashboard for all your events. Track performance, participant engagement, and success metrics with detailed insights.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="border-t border-gray-100 pt-8">
              <div className="grid grid-cols-2 gap-x-8 mb-10">
                <div>
                  <div className="text-4xl font-light text-orange-500 mb-2">Real-time</div>
                  <div className="text-sm text-gray-600">Event analytics</div>
                </div>
                <div>
                  <div className="text-5xl font-light text-orange-500 mb-2">AI</div>
                  <div className="text-sm text-gray-600">Powered insights</div>
                </div>
              </div>
              
              <Link href="/dashboard/organizer/host/analytics" className="inline-flex items-center text-gray-900 hover:text-orange-600 transition-colors group">
                <div className="w-12 h-12 rounded-full border-2 border-gray-900 flex items-center justify-center mr-3 group-hover:border-orange-500 group-hover:bg-orange-50 transition-all shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-base font-normal">View Analytics Dashboard</span>
              </Link>
            </CardContent>
          </Card>

          {/* Event Participants Dashboard Card - Third card aligned with first */}
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 h-full group">
            <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-40 group-hover:opacity-60 blur-2xl transition-opacity" />
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <Link href="/dashboard/organizer">
                  <Button size="sm" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-xl shadow-sm">
                    View
                  </Button>
                </Link>
              </div>
              
              <div className="mb-10">
                <div className="text-5xl mb-4 text-gray-300 font-serif">"</div>
                <h3 className="text-3xl font-light text-gray-900 leading-tight mb-6">
                  Event Participants Dashboard
                </h3>
                <p className="text-base text-gray-600 leading-relaxed min-h-[72px]">
                  Access your event participation details in one place. Monitor registrations, track attendance, and manage participant interactions effectively.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="border-t border-gray-100 pt-8">
              <div className="grid grid-cols-2 gap-x-8 mb-10">
                <div>
                  <div className="text-5xl font-light text-orange-500 mb-2">Track</div>
                  <div className="text-sm text-gray-600">All registrations</div>
                </div>
                <div>
                  <div className="text-5xl font-light text-orange-500 mb-2">Manage</div>
                  <div className="text-sm text-gray-600">Attendance records</div>
                </div>
              </div>
              
              <Link href="/dashboard/organizer" className="inline-flex items-center text-gray-900 hover:text-orange-600 transition-colors group">
                <div className="w-12 h-12 rounded-full border-2 border-gray-900 flex items-center justify-center mr-3 group-hover:border-orange-500 group-hover:bg-orange-50 transition-all shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-base font-normal">View Participants</span>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
