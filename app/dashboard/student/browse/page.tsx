"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Users, Trophy, Globe, Monitor, MapPinIcon, Star, ExternalLink } from "lucide-react"
import { supabase, type Event, type Club } from "@/lib/supabase"
import Link from "next/link"

interface EventWithClub extends Event {
  club?: Club
}

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function BrowseEventsPage() {
  const [events, setEvents] = useState<EventWithClub[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventWithClub[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedMode, setSelectedMode] = useState("all")
  const [sortBy, setSortBy] = useState("deadline")

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterAndSortEvents()
  }, [events, searchTerm, selectedCategory, selectedType, selectedMode, sortBy])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*)
        `)
        .eq("status", "published")
        .gt("registration_deadline", now)
        .order("registration_deadline", { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortEvents = () => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
      const matchesType = selectedType === "all" || event.type === selectedType
      const matchesMode = selectedMode === "all" || event.mode === selectedMode

      return matchesSearch && matchesCategory && matchesType && matchesMode
    })

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime()
        case "date":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case "popularity":
          return b.current_participants - a.current_participants
        case "prize":
          return (b.prize_pool || 0) - (a.prize_pool || 0)
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }

  const getDeadlineUrgency = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) return { level: "critical", color: "bg-red-500", text: "Closing Today!" }
    if (diffDays <= 3) return { level: "high", color: "bg-orange-500", text: `${diffDays} days left` }
    if (diffDays <= 7) return { level: "medium", color: "bg-yellow-500", text: `${diffDays} days left` }
    return { level: "low", color: "bg-green-500", text: `${diffDays} days left` }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "online":
        return <Globe className="h-4 w-4" />
      case "offline":
        return <MapPinIcon className="h-4 w-4" />
      case "hybrid":
        return <Monitor className="h-4 w-4" />
      default:
        return <MapPinIcon className="h-4 w-4" />
    }
  }

  const getTeamSizeDisplay = (teamSize: string) => {
    switch (teamSize) {
      case "solo":
        return "Solo"
      case "2_people":
        return "2 People"
      case "group_4+":
        return "Group 4+"
      default:
        return "Solo"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Discover Events</h1>
                <p className="text-blue-100 text-lg">Find exciting events happening on your campus</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{filteredEvents.length}</div>
                <div className="text-blue-100">Events Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events, clubs, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">Registration Deadline</SelectItem>
                    <SelectItem value="date">Event Date</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="prize">Prize Pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later for new events.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const urgency = getDeadlineUrgency(event.registration_deadline)
              return (
                <Link key={event.id} href={`/dashboard/student/events/${event.id}`}>
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 cursor-pointer">
                    <div className="relative">
                      <img
                        src={
                          event.image_url ||
                          `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(event.title) || "/placeholder.svg"}`
                        }
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 text-gray-700">
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Event Title & Club */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          {event.club && <p className="text-sm text-indigo-600 font-medium">{event.club.name}</p>}
                        </div>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              {formatDate(event.start_date)} at {formatTime(event.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {getModeIcon(event.mode)}
                            <span className="ml-2">
                              {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
                              {event.venue && ` • ${event.venue}`}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              {event.current_participants}
                              {event.max_participants && `/${event.max_participants}`} participants
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{event.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Event Stats */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Star className="h-4 w-4 mr-1 text-yellow-500" />
                              <span>{getTeamSizeDisplay(event.team_size || "solo")}</span>
                            </div>
                            {event.level && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  event.level === "beginner"
                                    ? "border-green-200 text-green-700"
                                    : event.level === "intermediate"
                                      ? "border-yellow-200 text-yellow-700"
                                      : "border-red-200 text-red-700"
                                }`}
                              >
                                {event.level.charAt(0).toUpperCase() + event.level.slice(1)}
                              </Badge>
                            )}
                          </div>
                          {event.prize_pool && (
                            <div className="flex items-center text-green-600 font-semibold text-sm">
                              <Trophy className="h-4 w-4 mr-1" />₹{event.prize_pool.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Entry Fee */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-gray-900">
                            {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
                          </div>
                          <div className="text-sm text-indigo-600 font-medium group-hover:text-indigo-800 transition-colors">
                            View Details →
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
