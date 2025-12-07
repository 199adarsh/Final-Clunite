"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Calendar, 
  IndianRupee, 
  MapPin, 
  Search, 
  Plus, 
  XCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Edit, 
  Trash2,
  UserCheck
} from "lucide-react"
import { EventImage } from "./EventImage"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string | null
  status: "draft" | "published" | "cancelled" | "completed"
  venue: string | null
  entry_fee: number
  current_participants: number
  max_participants: number | null
  mode: "online" | "offline" | "hybrid"
  type: string
  category: string
  image_url: string | null
} 

export default function EventManagementHub() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizerEvents()
  }, [])

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Please log in to view your events")
        return
      }

      // Fetch events created by this organizer
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error("Error fetching organizer events:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />
      case "draft":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-12 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchOrganizerEvents}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage and track all your events</p>
        </div>
        <Link href="/dashboard/organizer/host">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Events</p>
                <p className="text-3xl font-bold mt-2">{events.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Published</p>
                <p className="text-3xl font-bold mt-2">{events.filter(e => e.status === 'published').length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Participants</p>
                <p className="text-3xl font-bold mt-2">{events.reduce((sum, e) => sum + e.current_participants, 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Drafts</p>
                <p className="text-3xl font-bold mt-2">{events.filter(e => e.status === 'draft').length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input 
          placeholder="Search events..." 
          className="pl-10 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6 text-center max-w-sm">
              {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first event"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/organizer/host">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden">
                <EventImage
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"
                />
                <div className="absolute top-3 right-3">
                  <Badge className={`${getStatusColor(event.status)} shadow-lg`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status}</span>
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Event Content */}
              <CardContent className="p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
                </div>

                {/* Event Meta */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="truncate">{event.venue || `${event.mode} event`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IndianRupee className="h-4 w-4 text-amber-500" />
                      <span>{event.entry_fee === 0 ? "Free" : `₹${event.entry_fee}`}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">{event.type}</Badge>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Participants</p>
                      <p className="text-lg font-bold text-gray-900">
                        {event.current_participants}{event.max_participants && `/${event.max_participants}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/dashboard/organizer/events/${event.id}/participants`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Participants
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
