"use client"

import { useState } from "react"
import { ArrowLeft, Users, Calendar, Star, MapPin, Clock, Trophy, ExternalLink, Plus, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useClub, joinClubInstant, leaveClubInstant } from "@/hooks/useClubs"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function ClubProfilePage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.clubId as string
  const { club, events, loading, error, refetch } = useClub(clubId)
  const [activeTab, setActiveTab] = useState("overview")
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)

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

  const getEventTypeColor = (type: string) => {
    const colors = {
      workshop: "bg-blue-100 text-blue-800 border-blue-200",
      competition: "bg-red-100 text-red-800 border-red-200",
      seminar: "bg-green-100 text-green-800 border-green-200",
      cultural: "bg-purple-100 text-purple-800 border-purple-200",
      sports: "bg-orange-100 text-orange-800 border-orange-200",
      technical: "bg-indigo-100 text-indigo-800 border-indigo-200",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "online":
        return "🌐"
      case "offline":
        return "📍"
      case "hybrid":
        return "🔄"
      default:
        return "📅"
    }
  }

  // Separate upcoming and past events
  const now = new Date()
  const upcomingEvents = events.filter((event) => new Date(event.start_date) > now)
  const pastEvents = events.filter((event) => new Date(event.start_date) <= now)

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error loading club</div>
          <div className="text-gray-600 mb-4">{error || "Club not found"}</div>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-slate-600 font-medium">Back to My Clubs</div>
      </div>

      {/* Club Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200">
        {/* Banner Background */}
        {club.banner_url ? (
          <>
            <div className="absolute inset-0">
              <img 
                src={club.banner_url} 
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          </>
        )}
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Club Logo */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl">
                {club.name.charAt(0)}
              </div>
              {club.is_verified && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-500 text-white border-green-600 font-bold px-2 py-1">✓</Badge>
                </div>
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-4xl font-black text-white drop-shadow-lg">{club.name}</h1>
                  <Badge variant="secondary" className="bg-white/90 text-slate-700 font-semibold">
                    {club.category}
                  </Badge>
                </div>
                <p className="text-lg text-white drop-shadow-md max-w-2xl leading-relaxed">{club.description}</p>
              </div>

              {/* Club Stats */}
              <div className="flex flex-wrap items-center gap-6 text-white drop-shadow-md">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">{club.members_count} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">{club.events_hosted_count} events hosted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{club.credibility_score?.toFixed?.(1) ?? "0.0"} rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span className="font-semibold">{club.college}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8"
                disabled={joining}
                onClick={async () => {
                  try {
                    setJoining(true)
                    // TODO: replace with real current user id from auth
                    const CURRENT_USER_ID = "550e8400-e29b-41d4-a716-446655440001"
                    await joinClubInstant(CURRENT_USER_ID, clubId)
                  } finally {
                    setJoining(false)
                    await refetch()
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {joining ? "Joining..." : "Join Club"}
              </Button>
              <Button
                variant="outline"
                disabled={leaving}
                onClick={async () => {
                  try {
                    setLeaving(true)
                    const CURRENT_USER_ID = "550e8400-e29b-41d4-a716-446655440001"
                    await leaveClubInstant(CURRENT_USER_ID, clubId)
                  } finally {
                    setLeaving(false)
                    await refetch()
                  }
                }}
              >
                {leaving ? "Removing..." : "Remove"}
              </Button>
              <Button variant="outline" className="bg-white/90 hover:bg-white">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-black text-blue-600 mb-1">{upcomingEvents.length}</div>
            <div className="text-sm font-semibold text-blue-700">Upcoming Events</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-black text-green-600 mb-1">{pastEvents.length}</div>
            <div className="text-sm font-semibold text-green-700">Past Events</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-black text-purple-600 mb-1">
              {events.filter((e) => e.prize_pool && e.prize_pool > 0).length}
            </div>
            <div className="text-sm font-semibold text-purple-700">Prize Events</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-black text-orange-600 mb-1">
              ₹{events.reduce((sum, e) => sum + (e.prize_pool || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-orange-700">Total Prizes</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="font-semibold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="font-semibold">
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="font-semibold">
            Past ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold text-slate-900">About {club.name}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">{club.description}</p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Founded</span>
                    <span className="font-semibold">{formatDate(club.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Category</span>
                    <Badge variant="secondary">{club.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">College</span>
                    <span className="font-semibold">{club.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status</span>
                    <Badge
                      className={club.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {club.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold text-slate-900">Recent Events</h3>
              </CardHeader>
              <CardContent>
                {events.slice(0, 3).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-slate-600">No events yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg">
                            {event.type === "competition"
                              ? "🏆"
                              : event.type === "workshop"
                                ? "🛠️"
                                : event.type === "seminar"
                                  ? "🎓"
                                  : event.type === "cultural"
                                    ? "🎭"
                                    : event.type === "sports"
                                      ? "⚽"
                                      : "💻"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{event.title}</div>
                          <div className="text-sm text-slate-600">
                            {formatDate(event.start_date)} • {event.current_participants} registered
                          </div>
                        </div>
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No upcoming events</h3>
              <p className="text-slate-600">Check back later for new events from this club.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-indigo-200 hover:-translate-y-1"
                >
                  <CardHeader className="p-0 relative overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
                      {event.image_url && (
                        <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      )}
                      <div className="text-5xl opacity-20">
                        {event.type === "competition"
                          ? "🏆"
                          : event.type === "workshop"
                            ? "🛠️"
                            : event.type === "seminar"
                              ? "🎓"
                              : event.type === "cultural"
                                ? "🎭"
                                : event.type === "sports"
                                  ? "⚽"
                                  : "💻"}
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-slate-700">
                          {getModeIcon(event.mode)} {event.mode}
                        </Badge>
                      </div>
                      {event.prize_pool && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-bold">
                            <Trophy className="h-3 w-3 mr-1" />₹{event.prize_pool.toLocaleString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(event.start_date)} at {formatTime(event.start_date)}
                        </span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.current_participants}
                          {event.max_participants && `/${event.max_participants}`} registered
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Register by {formatDate(event.registration_deadline)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-lg font-bold text-slate-900">
                        {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
                      </div>
                      <Link href={`/dashboard/student/events/${event.id}`}>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold group"
                        >
                          View Details
                          <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No past events</h3>
              <p className="text-slate-600">This club hasn't hosted any events yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl opacity-60">
                          {event.type === "competition"
                            ? "🏆"
                            : event.type === "workshop"
                              ? "🛠️"
                              : event.type === "seminar"
                                ? "🎓"
                                : event.type === "cultural"
                                  ? "🎭"
                                  : event.type === "sports"
                                    ? "⚽"
                                    : "💻"}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                          <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                          <Badge variant="outline" className="text-slate-600">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-slate-600 line-clamp-1">{event.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.start_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{event.current_participants} participants</span>
                          </div>
                          {event.prize_pool && (
                            <div className="flex items-center space-x-1">
                              <Trophy className="h-4 w-4" />
                              <span>₹{event.prize_pool.toLocaleString()} prizes</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href={`/dashboard/student/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
