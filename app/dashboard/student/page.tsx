"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserFromDatabase } from "@/lib/sync-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Award, Users, QrCode, Clock, MapPin, Star, TrendingUp, Target, Sparkles, Loader2 } from "lucide-react"

export default function StudentDashboard() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      if (authUser) {
        const dbUser = await getUserFromDatabase(authUser.id)
        setUserData(dbUser)
      } else if (!authLoading) {
        // No user and not loading = not authenticated
        console.log('❌ No authenticated user, redirecting to login')
        router.push('/login')
        return
      }
      setLoading(false)
    }
    
    if (!authLoading) {
      loadUserData()
    }
  }, [authUser, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Double check - if no user at this point, redirect
  if (!authUser) {
    router.push('/login')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const user = {
    name: userData?.full_name || authUser?.user_metadata?.full_name || "Student",
    college: userData?.college || "Your College"
  }

  const stats = [
    {
      title: "Registered Events",
      value: "12",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      change: "+3 this month",
    },
    {
      title: "Certificates Earned",
      value: "8",
      icon: Award,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      change: "+2 this week",
    },
    {
      title: "Events Attended",
      value: "15",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      change: "+5 this month",
    },
    {
      title: "QR Scans",
      value: "23",
      icon: QrCode,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      change: "+8 this month",
    },
  ]

  const recommendedEvents = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      club: "Tech Club",
      date: "Dec 15, 2024",
      time: "2:00 PM",
      venue: "Auditorium A",
      participants: 150,
      rating: 4.8,
      tags: ["Technology", "Workshop"],
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: 2,
      title: "Cultural Fest 2024",
      club: "Cultural Committee",
      date: "Dec 20, 2024",
      time: "6:00 PM",
      venue: "Main Ground",
      participants: 500,
      rating: 4.9,
      tags: ["Cultural", "Festival"],
      gradient: "from-pink-500 to-rose-600",
    },
    {
      id: 3,
      title: "Startup Pitch Competition",
      club: "Entrepreneurship Cell",
      date: "Dec 18, 2024",
      time: "10:00 AM",
      venue: "Conference Hall",
      participants: 80,
      rating: 4.7,
      tags: ["Business", "Competition"],
      gradient: "from-green-500 to-emerald-600",
    },
  ]

  const upcomingEvents = [
    {
      id: 1,
      title: "React.js Masterclass",
      club: "Web Dev Society",
      date: "Dec 12, 2024",
      time: "3:00 PM",
      venue: "Lab 201",
      status: "registered",
    },
    {
      id: 2,
      title: "Photography Workshop",
      club: "Photography Club",
      date: "Dec 14, 2024",
      time: "11:00 AM",
      venue: "Studio B",
      status: "registered",
    },
  ]

  return (
    <div className="space-y-8 bg-[#FBF7F4] min-h-screen p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          </div>
          <p className="text-white/90 text-lg">Ready to discover amazing events at {user.college}?</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" />5 new recommendations
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              <Target className="h-4 w-4 mr-1" />2 events this week
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-orange-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recommended Events */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <Star className="h-6 w-6 mr-3 text-orange-500" />
                Recommended for You
              </CardTitle>
              <CardDescription className="text-gray-600">
                Events picked based on your interests and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedEvents.map((event) => (
                <div
                  key={event.id}
                  className="group border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-orange-500 transition-all duration-300 bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 font-medium">by {event.club}</p>
                    </div>
                    <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      {event.rating}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4 space-x-6">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {event.date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg transition-all duration-300"
                    >
                      Register Now
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md transition-all duration-300">
                <QrCode className="h-5 w-5 mr-3" />
                Scan QR Code
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 bg-white"
              >
                <Award className="h-5 w-5 mr-3" />
                View Certificates
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 bg-white"
              >
                <Calendar className="h-5 w-5 mr-3" />
                My Events
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Achievement Unlocked!</h3>
                <p className="text-gray-600 text-sm mb-4">You've attended 15 events this semester</p>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  View Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
