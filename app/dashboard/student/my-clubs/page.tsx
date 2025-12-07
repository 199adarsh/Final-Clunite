"use client"

import { useState } from "react"
import { Search, Plus, Users, Calendar, Star, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useClubs, useUserClubs, joinClubInstant, leaveClubInstant } from "@/hooks/useClubs"
import { useEventsForClubIds } from "@/hooks/useEvents"
import Link from "next/link"

// Mock user ID - in real app, this would come from auth
const CURRENT_USER_ID = "550e8400-e29b-41d4-a716-446655440001"

export default function MyClubsPage() {
  const { clubs: allClubs, loading: allClubsLoading, refetch: refetchAllClubs } = useClubs()
  const { clubs: userClubs, loading: userClubsLoading, refetch: refetchUserClubs } = useUserClubs(CURRENT_USER_ID)
  const [searchTerm, setSearchTerm] = useState("")
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState("joined")

  const joinedClubIds = userClubs.map((c) => c.id)
  const { events: joinedClubsEvents, loading: eventsLoading, refetch: refetchJoinedEvents } = useEventsForClubIds(joinedClubIds)

  // Filter clubs based on search
  const filteredUserClubs = userClubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAvailableClubs = allClubs.filter((club) => {
    const isNotMember = !userClubs.some((userClub) => userClub.id === club.id)
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.category.toLowerCase().includes(searchTerm.toLowerCase())
    return isNotMember && matchesSearch
  })

  const ClubCard = ({ club, isMember = false }: { club: any; isMember?: boolean }) => (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-indigo-200 hover:-translate-y-1">
      <CardHeader className="p-0 relative overflow-hidden">
        <div className="h-32 relative">
          {club.banner_url ? (
            <>
              <img 
                src={club.banner_url} 
                alt={club.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {club.name.charAt(0)}
              </div>
            </div>
          )}
          {club.is_verified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">✓ Verified</Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-slate-700 font-medium">
              {club.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {club.name}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2">{club.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{club.members_count} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{club.events_hosted_count} events</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="font-semibold">{club.credibility_score?.toFixed?.(1) ?? "0.0"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-500">{club.college}</div>
          <div className="flex space-x-2">
            <Link href={`/dashboard/student/my-clubs/${club.id}`}>
              <Button variant="outline" size="sm" className="group bg-transparent">
                View Details
                <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {!isMember && (
              <Button
                size="sm"
                disabled={joiningClubId === club.id}
                onClick={async () => {
                  try {
                    setJoiningClubId(club.id)
                    await joinClubInstant(CURRENT_USER_ID, club.id)
                  } finally {
                    setJoiningClubId(null)
                    await Promise.all([refetchUserClubs(), refetchAllClubs()])
                    await refetchJoinedEvents()
                    setTabValue("joined")
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Plus className="mr-1 h-3 w-3" />
                {joiningClubId === club.id ? "Joining..." : "Join"}
              </Button>
            )}
            {isMember && (
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await leaveClubInstant(CURRENT_USER_ID, club.id)
                  await Promise.all([refetchUserClubs(), refetchAllClubs()])
                  await refetchJoinedEvents()
                  setTabValue("discover")
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ClubSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="h-32 w-full" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">My Clubs</h1>
            <p className="text-lg text-slate-600">Manage your club memberships and discover new communities</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 px-4 py-2 text-sm font-semibold">
              {userClubs.length} Clubs Joined
            </Badge>
            <Link href="/dashboard/student/my-clubs/discover">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Discover Clubs
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 focus:border-indigo-300 transition-colors"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-black text-indigo-600 mb-2">{userClubs.length}</div>
            <div className="text-sm font-semibold text-indigo-700">Clubs Joined</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-black text-purple-600 mb-2">
              {userClubs.reduce((sum, club) => sum + (club.events_hosted_count || 0), 0)}
            </div>
            <div className="text-sm font-semibold text-purple-700">Total Events</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-black text-pink-600 mb-2">
              {userClubs.reduce((sum, club) => sum + (club.members_count || 0), 0)}
            </div>
            <div className="text-sm font-semibold text-pink-700">Network Size</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-black text-green-600 mb-2">
              {userClubs.length > 0
                ? (
                    userClubs.reduce((sum, club) => sum + (club.credibility_score || 0), 0) / userClubs.length
                  ).toFixed(1)
                : "0.0"}
            </div>
            <div className="text-sm font-semibold text-green-700">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="joined" className="font-semibold">
            My Clubs ({userClubs.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="font-semibold">
            Discover ({filteredAvailableClubs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="joined" className="space-y-6">
          {userClubsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ClubSkeleton key={i} />
              ))}
            </div>
          ) : filteredUserClubs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏛️</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {searchTerm ? "No clubs found" : "No clubs joined yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms to find clubs."
                  : "Start by discovering and joining clubs that match your interests."}
              </p>
              <Link href="/dashboard/student/my-clubs/discover">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Discover Clubs
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUserClubs.map((club) => (
                  <ClubCard key={club.id} club={club} isMember={true} />
                ))}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Events from your clubs</h2>
                {eventsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ClubSkeleton key={i} />
                    ))}
                  </div>
                ) : joinedClubsEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">No events yet from your clubs.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedClubsEvents.map((event) => (
                      <Card key={event.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-indigo-200 hover:-translate-y-1">
                        <CardHeader className="p-0 relative overflow-hidden">
                          <div className="h-32 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
                            {event.image_url ? (
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`text-5xl opacity-20 ${event.image_url ? 'hidden' : ''}`}>📅</div>
                            <div className="absolute top-3 left-3 z-10">
                              <Badge variant="secondary" className="bg-white/90 text-slate-700 backdrop-blur-sm">
                                {event.club?.name}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {event.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm text-slate-600">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(event.start_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {event.current_participants}
                                  {event.max_participants && `/${event.max_participants}`} registered
                                </span>
                              </div>
                            </div>
                            <Link href={`/dashboard/student/events/${event.id}`}>
                              <Button variant="outline" size="sm" className="group bg-transparent">
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
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {allClubsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ClubSkeleton key={i} />
              ))}
            </div>
          ) : filteredAvailableClubs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No new clubs found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms to find more clubs."
                  : "You've already joined all available clubs! Check back later for new ones."}
              </p>
              {searchTerm && <Button onClick={() => setSearchTerm("")}>Clear Search</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableClubs.map((club) => (
                <ClubCard key={club.id} club={club} isMember={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
