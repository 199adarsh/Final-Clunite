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
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-transparent via-purple-50/20 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-primary" />
              Event Management Hub
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Manage all your created events and view participant details
            </CardDescription>
          </div>
          <Link href="/dashboard/organizer/host">
            <Button className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-indigo-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search your events..." 
              className="pl-10 w-full max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-6">
              {events.length === 0 
                ? "You haven't created any events yet. Start by creating your first event!"
                : "No events match your search criteria."
              }
            </p>
            {events.length === 0 && (
              <Link href="/dashboard/organizer/host">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="border border-border/50 rounded-xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-card via-slate-50/30 to-purple-50/20 backdrop-blur-sm group"
              >
                {/* Event Image */}
                <div className="h-48 w-full">
                  <EventImage
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-purple-50 to-indigo-50"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(event.status)}
                            <span>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                          </div>
                        </Badge>
                      </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-green-500" />
                        {event.venue || `${event.mode} event`}
                      </div>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-2 text-yellow-500" />
                        {event.entry_fee === 0 ? "Free" : `₹${event.entry_fee}`}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center text-blue-600 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Participants</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {event.current_participants}
                        {event.max_participants && `/${event.max_participants}`}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center text-purple-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Type</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {event.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/organizer/events/${event.id}/participants`}>
                      <Button variant="outline" size="sm">
                        <UserCheck className="h-4 w-4 mr-2" />
                        View Participants
                      </Button>
                    </Link>
                    
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
