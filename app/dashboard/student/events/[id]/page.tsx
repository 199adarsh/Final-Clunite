"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { EventImage } from "@/components/EventImage"
import {
  Calendar,
  Clock,
  UserPlus,
  ArrowLeft,
  Users,
  Eye,
  Heart,
  Share2,
  MapPin,
  Trophy,
  Star,
  Globe,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Tag,
  Award,
  Target,
  BookOpen,
  Zap,
  User,
  X,
} from "lucide-react"
import Link from "next/link"
import { supabase, type Event, type Club } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface EventWithClub extends Event {
  club?: Club
}

interface TeamMember {
  name: string
  email: string
  phone: string
  college: string
  year: string
  branch: string
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventWithClub | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)

  const [registrationData, setRegistrationData] = useState({
    // Solo participant data
    participantName: "",
    participantEmail: "",
    participantPhone: "",
    participantCollege: "",
    participantYear: "",
    participantSkills: "",
    participantExperience: "",
    // Team data
    teamName: "",
    teamMembers: [] as TeamMember[],
    // Additional info
    specialRequirements: "",
    dietaryRestrictions: "",
    branch: "",
  })

  useEffect(() => {
    fetchEventDetails()
    if (user) {
      checkRegistrationStatus()
    }
  }, [params.id, user])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const { data: eventData, error } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      // Get fresh registration count
      const { data: regCount } = await supabase
        .from("event_registrations")
        .select("registration_data")
        .eq("event_id", params.id)

      // Calculate total participants including team members
      const totalParticipants = regCount?.reduce((total, reg) => {
        if (reg.registration_data?.team_members) {
          return total + reg.registration_data.team_members.length;
        } else if (reg.registration_data?.participant_details) {
          return total + 1;
        }
        return total;
      }, 0) || 0;

      // Update the event data with the fresh count
      const updatedEvent = {
        ...eventData,
        current_participants: totalParticipants
      };

      setEvent(updatedEvent)
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkRegistrationStatus = async () => {
    try {
      if (!user) {
        setIsRegistered(false)
        return
      }

      // Check registration for THIS specific user
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking registration:", error)
        return
      }

      setIsRegistered(!!data)
    } catch (error) {
      console.error("Error checking registration status:", error)
    }
  }

  const initializeTeamMembers = () => {
    if (!event) return

    const requiredMembers = event.team_size === "2_people" ? 2 : event.team_size === "group_4+" ? 4 : 1
    const members: TeamMember[] = []

    for (let i = 0; i < requiredMembers; i++) {
      members.push({
        name: "",
        email: "",
        phone: "",
        college: "",
        year: "",
        branch: "",
      })
    }

    setRegistrationData((prev) => ({ ...prev, teamMembers: members }))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setRegistrationData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => (i === index ? { ...member, [field]: value } : member)),
    }))
  }

  const addTeamMember = () => {
    if (registrationData.teamMembers.length < 8) {
      // Max 8 members
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            name: "",
            email: "",
            phone: "",
            college: "",
            year: "",
            branch: "",
          },
        ],
      }))
    }
  }

  const removeTeamMember = (index: number) => {
    const minMembers = event?.team_size === "2_people" ? 2 : event?.team_size === "group_4" ? 4 : 1
    if (registrationData.teamMembers.length > minMembers) {
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index),
      }))
    }
  }

  const handleRegistration = async () => {
    if (!event) return

    if (isRegistered) {
      setErrorMessage("You are already registered for this event!")
      setRegistrationStatus("error")
      return
    }

    if (event.team_size === "solo") {
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: [
          {
            name: "",
            email: "",
            phone: "",
            college: "",
            year: "",
            branch: "",
          },
        ],
      }))
    } else {
      initializeTeamMembers()
    }

    setShowRegistrationDialog(true)
  }

  const submitRegistration = async () => {
    if (!event) return

    try {
      setRegistering(true)
      setRegistrationStatus("idle")
      setErrorMessage("")
      setSuccessMessage("")

      // Validate required fields
      if (event.team_size === "solo") {
        const member = registrationData.teamMembers[0]
        if (!member.name || !member.email || !member.phone) {
          throw new Error("Please fill in all required fields")
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email)) {
          throw new Error("Please enter a valid email address")
        }

        // Check if already registered with this email
        const { data: existingReg } = await supabase
          .from("event_registrations")
          .select("id")
          .eq("event_id", params.id)
          .eq("registration_data->participant_details->email", member.email.toLowerCase())
          .maybeSingle()

        if (existingReg) {
          throw new Error("This email address has already been used to register for this event")
        }
      } else {
        // Validate team data
        if (!registrationData.teamName) {
          throw new Error("Please provide a team name")
        }

        // Check team member emails
        const emails = new Set()
        for (let i = 0; i < registrationData.teamMembers.length; i++) {
          const member = registrationData.teamMembers[i]
          if (!member.name || !member.email) {
            throw new Error(`Please fill in name and email for team member ${i + 1}`)
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(member.email)) {
            throw new Error(`Please enter a valid email address for team member ${i + 1}`)
          }

          const email = member.email.toLowerCase()
          if (emails.has(email)) {
            throw new Error("Each team member must have a unique email address")
          }
          emails.add(email)

          // Check if email already registered
          const { data: existingReg } = await supabase
            .from("event_registrations")
            .select("id")
            .eq("event_id", params.id)
            .or(`participant_details->email.eq.${email},team_members->email.cs.{${email}}`)
            .maybeSingle()

          if (existingReg) {
            throw new Error(`The email address ${member.email} has already been used to register for this event`)
          }
        }
      }

      // Check if event is still open and has capacity
      const { data: currentEvent, error: eventError } = await supabase
        .from("events")
        .select("current_participants, max_participants, registration_deadline")
        .eq("id", params.id)
        .single()

      if (eventError) throw eventError

      const now = new Date()
      const deadline = new Date(currentEvent.registration_deadline)
      if (now > deadline) {
        throw new Error("Registration deadline has passed")
      }

      if (currentEvent.max_participants && currentEvent.current_participants >= currentEvent.max_participants) {
        throw new Error("Event is full")
      }

      // Ensure user is logged in
      if (!user) {
        throw new Error("You must be logged in to register for events")
      }

      // Create registration record
      const registrationPayload = {
        event_id: params.id,
        user_id: user.id,
        team_name: event.team_size !== "solo" ? registrationData.teamName : null,
        status: "registered",  // Using the correct enum value from database
        registration_data: {
          registration_type: event.team_size,
          participant_details: event.team_size === "solo" ? {
            name: registrationData.teamMembers[0].name.trim(),
            email: registrationData.teamMembers[0].email.trim().toLowerCase(),
            phone: registrationData.teamMembers[0].phone.trim(),
            college: registrationData.teamMembers[0].college.trim(),
            year: registrationData.teamMembers[0].year.trim(),
            skills: registrationData.participantSkills?.trim(),
            experience: registrationData.participantExperience?.trim(),
          } : null,
          team_members: event.team_size !== "solo"
            ? registrationData.teamMembers.map(member => ({
                name: member.name.trim(),
                email: member.email.trim().toLowerCase(),
                phone: member.phone?.trim(),
                college: member.college?.trim(),
                year: member.year?.trim(),
                branch: member.branch?.trim(),
              }))
            : null,
          additional_info: {
            specialRequirements: registrationData.specialRequirements?.trim(),
            dietaryRestrictions: registrationData.dietaryRestrictions?.trim(),
            branch: registrationData.branch?.trim(),
          }
        },
      }

      // Insert the registration
      const { data: newRegistration, error: registrationError } = await supabase
        .from("event_registrations")
        .insert(registrationPayload)
        .select()
        .single()

      if (registrationError) {
        throw new Error(registrationError.message || "Failed to save registration")
      }

      // Update the participant count in the events table
      const { error: updateError } = await supabase
        .from("events")
        .update({
          current_participants: currentEvent.current_participants + (event.team_size === "solo" ? 1 : registrationData.teamMembers.length)
        })
        .eq("id", params.id)

      if (registrationError) {
        console.error("Registration error:", registrationError)
        throw new Error(registrationError.message || "Failed to save registration")
      }

      if (!newRegistration) {
        throw new Error("Registration data not saved properly")
      }

      // Log successful registration
      console.log("Registration saved successfully")

      if (updateError) {
        console.error("Failed to update participant count:", updateError)
        // Don't throw here since registration was successful
      }

      // Update UI state
      setRegistrationStatus("success")
      setSuccessMessage("Registration completed successfully! You will receive a confirmation email shortly.")
      setIsRegistered(true)
      setShowRegistrationDialog(false)

      // Refresh event data to show updated participant count
      await fetchEventDetails()
    } catch (error) {
      console.error("Registration error:", error)
      setRegistrationStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getDeadlineUrgency = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return { level: "expired", color: "text-red-600", text: "Registration Closed" }
    if (diffDays <= 1) return { level: "critical", color: "text-red-600", text: "Closes Today!" }
    if (diffDays <= 3) return { level: "high", color: "text-orange-600", text: `${diffDays} days left` }
    if (diffDays <= 7) return { level: "medium", color: "text-yellow-600", text: `${diffDays} days left` }
    return { level: "low", color: "text-green-600", text: `${diffDays} days left` }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "online":
        return <Globe className="h-5 w-5" />
      case "offline":
        return <MapPin className="h-5 w-5" />
      case "hybrid":
        return <Monitor className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  const getTeamSizeDisplay = (teamSize: string) => {
    switch (teamSize) {
      case "solo":
        return "Individual Participation"
      case "2_people":
        return "Team of 2 People"
      case "group_4":
        return "Team of 4 People"
      default:
        return "Individual Participation"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-2xl p-8">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/dashboard/student/browse">
            <Button>Back to Browse Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const urgency = getDeadlineUrgency(event.registration_deadline)
  const isRegistrationOpen = urgency.level !== "expired"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/dashboard/student/browse"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Browse Events
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <div className="relative h-64 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
                <img
                  src={
                    event.image_url || `/placeholder.svg?height=300&width=800&query=${encodeURIComponent(event.title)}`
                  }
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Badge className="bg-white/90 text-gray-800 font-semibold">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                    <Badge className="bg-white/90 text-gray-800 font-semibold">
                      {getModeIcon(event.mode)}
                      <span className="ml-1">{event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}</span>
                    </Badge>
                    {event.prize_pool && (
                      <Badge className="bg-yellow-500 text-white font-bold">
                        <Trophy className="h-3 w-3 mr-1" />₹{event.prize_pool.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                  {event.club && (
                    <div className="flex items-center text-white/90">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-sm font-bold">{event.club.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{event.club.name}</div>
                        <div className="flex items-center text-sm">
                          <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                          <span>{event.club.credibility_score?.toFixed(1) || "4.0"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Details Tabs */}
            <Tabs defaultValue="overview" className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent rounded-none p-0">
                <TabsTrigger value="overview" className="px-6 py-4 font-semibold">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="details" className="px-6 py-4 font-semibold">
                  Details
                </TabsTrigger>
                <TabsTrigger value="requirements" className="px-6 py-4 font-semibold">
                  Requirements
                </TabsTrigger>
                <TabsTrigger value="organizer" className="px-6 py-4 font-semibold">
                  Organizer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
                </div>

                {/* Key Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                        Event Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="font-semibold text-gray-900">Start Date & Time</div>
                        <div className="text-gray-600">
                          {formatDate(event.start_date)} at {formatTime(event.start_date)}
                        </div>
                      </div>
                      {event.end_date && (
                        <div>
                          <div className="font-semibold text-gray-900">End Date & Time</div>
                          <div className="text-gray-600">
                            {formatDate(event.end_date)} at {formatTime(event.end_date)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">Duration</div>
                        <div className="text-gray-600">{event.duration}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <Users className="h-5 w-5 mr-2 text-green-600" />
                        Participation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="font-semibold text-gray-900">Team Size</div>
                        <div className="text-gray-600">{getTeamSizeDisplay(event.team_size || "solo")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Difficulty Level</div>
                        <Badge className={getLevelColor(event.level || "beginner")}>
                          {(event.level || "beginner").charAt(0).toUpperCase() + (event.level || "beginner").slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Registered Participants</div>
                        <div className="text-gray-600">
                          {event.current_participants}
                          {event.max_participants && ` / ${event.max_participants}`} participants
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-red-500" />
                        Location & Venue
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="font-medium text-gray-900">
                          {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)} Event
                        </div>
                        {event.venue && <div className="text-gray-600 mt-1">{event.venue}</div>}
                        <div className="text-gray-600 mt-1">{event.college}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Rewards & Recognition
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {event.prize_pool ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              Prize Pool: ₹{event.prize_pool.toLocaleString()}
                            </div>
                            <div className="text-gray-600 mt-1">Exciting prizes for winners!</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">Certificates & Recognition</div>
                            <div className="text-gray-600 mt-1">All participants will receive certificates</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-blue-500" />
                        Important Dates
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Registration Deadline</span>
                          <span className="font-medium text-gray-900">{formatDate(event.registration_deadline)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Event Date</span>
                          <span className="font-medium text-gray-900">{formatDate(event.start_date)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className={`font-semibold ${urgency.color}`}>{urgency.text}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-purple-500" />
                        Category & Type
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category</span>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Event Type</span>
                          <Badge variant="outline">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="requirements" className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="h-6 w-6 mr-2 text-indigo-600" />
                      Requirements & Prerequisites
                    </h2>
                  </div>

                  {event.requirements && event.requirements.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        What You Need
                      </h3>
                      <ul className="space-y-3">
                        {event.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-blue-800">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-green-900 mb-2">No Special Requirements</h3>
                      <p className="text-green-700">
                        This event is open to everyone! Just bring your enthusiasm and willingness to learn.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Award className="h-5 w-5 mr-2 text-orange-500" />
                          Skill Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={`${getLevelColor(event.level || "beginner")} text-sm px-3 py-1`}>
                          {(event.level || "beginner").charAt(0).toUpperCase() + (event.level || "beginner").slice(1)}{" "}
                          Level
                        </Badge>
                        <p className="text-gray-600 mt-2">
                          {event.level === "beginner" && "Perfect for newcomers and those just starting out."}
                          {event.level === "intermediate" && "Suitable for those with some prior experience."}
                          {event.level === "advanced" && "Designed for experienced participants seeking challenges."}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Users className="h-5 w-5 mr-2 text-green-500" />
                          Team Formation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="font-medium text-gray-900 mb-2">
                          {getTeamSizeDisplay(event.team_size || "solo")}
                        </div>
                        <p className="text-gray-600">
                          {event.team_size === "solo" && "Individual participation - showcase your personal skills!"}
                          {event.team_size === "2_people" &&
                            "Partner up with a friend or colleague for this collaborative experience."}
                          {event.team_size === "group_4+" &&
                            "Form a team of 4 or more members to tackle this challenge together."}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="organizer" className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Organizer</h2>
                  </div>

                  {event.club ? (
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                            {event.club.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{event.club.name}</h3>
                              {event.club.is_verified && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{event.club.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{event.club.members_count} members</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{event.club.events_hosted_count} events hosted</span>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                <span>{event.club.credibility_score?.toFixed(1)} rating</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Independent Event</h3>
                          <p className="text-gray-600">This event is organized independently.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contact Information */}
                  {(event.contact_info?.email || event.contact_info?.phone) && (
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {event.contact_info.email && (
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-3 text-gray-400" />
                            <a
                              href={`mailto:${event.contact_info.email}`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {event.contact_info.email}
                            </a>
                          </div>
                        )}
                        {event.contact_info.phone && (
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 mr-3 text-gray-400" />
                            <a
                              href={`tel:${event.contact_info.phone}`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {event.contact_info.phone}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Registration Card */}
              <Card className="border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500">
                        <Calendar className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Registration Status */}
                  <div className="mb-4">
                    <div className={`font-semibold ${urgency.color} flex items-center`}>
                      {urgency.level === "expired" ? (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      {urgency.text}
                    </div>
                  </div>

                  {/* Registration Status Messages */}
                  {registrationStatus === "success" && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {successMessage || "Registration successful! You're all set for the event."}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {registrationStatus === "error" && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isRegistrationOpen ? (
                    <Button
                      onClick={handleRegistration}
                      disabled={registering || isRegistered}
                      className={`w-full py-3 rounded-lg font-semibold text-base mb-4 ${
                        isRegistered ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
                      } text-white`}
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Registered
                        </>
                      ) : event.team_size === "solo" ? (
                        "Register Now"
                      ) : (
                        `Register Team`
                      )}
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full py-3 rounded-lg font-semibold text-base mb-4 bg-gray-300 text-gray-500"
                    >
                      Registration Closed
                    </Button>
                  )}

                  {/* Event Stats */}
                  <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Participants</span>
                      <span className="font-semibold text-gray-900">
                        {event.current_participants}
                        {event.max_participants && ` / ${event.max_participants}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Event Views</span>
                      <span className="font-semibold text-gray-900">2,450</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Team Size</span>
                      <span className="font-semibold text-gray-900">
                        {getTeamSizeDisplay(event.team_size || "solo")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Features */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Event Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.contact_info?.certificates_enabled && (
                    <div className="flex items-center text-sm">
                      <Award className="h-4 w-4 mr-2 text-green-500" />
                      <span>Digital Certificates</span>
                    </div>
                  )}
                  {event.contact_info?.qr_enabled && (
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                      <span>QR Code Attendance</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Eye className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Live Event Updates</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <User className="h-6 w-6 mr-2 text-indigo-600" />
              {event?.team_size === "solo" ? "Register for Event" : "Team Registration"}
            </DialogTitle>
            <DialogDescription>
              {event?.team_size === "solo"
                ? "Fill in your details to register for this event"
                : `Create your team of ${getTeamSizeDisplay(event?.team_size || "solo").toLowerCase()} and register`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Messages */}
            {registrationStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {event?.team_size === "solo" ? (
              // Solo Registration Form
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={registrationData.teamMembers[0]?.name || ""}
                      onChange={(e) => updateTeamMember(0, "name", e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registrationData.teamMembers[0]?.email || ""}
                      onChange={(e) => updateTeamMember(0, "email", e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={registrationData.teamMembers[0]?.phone || ""}
                      onChange={(e) => updateTeamMember(0, "phone", e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="college">College/University</Label>
                    <Input
                      id="college"
                      value={registrationData.teamMembers[0]?.college || ""}
                      onChange={(e) => updateTeamMember(0, "college", e.target.value)}
                      placeholder="Enter your college"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year of Study</Label>
                    <Input
                      id="year"
                      value={registrationData.teamMembers[0]?.year || ""}
                      onChange={(e) => updateTeamMember(0, "year", e.target.value)}
                      placeholder="e.g., 2nd Year, Final Year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={registrationData.branch}
                      onChange={(e) => setRegistrationData((prev) => ({ ...prev, branch: e.target.value }))}
                      placeholder="Your branch/department"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="skills">Relevant Skills/Experience</Label>
                  <Textarea
                    id="skills"
                    value={registrationData.participantSkills}
                    onChange={(e) => setRegistrationData((prev) => ({ ...prev, participantSkills: e.target.value }))}
                    placeholder="Describe your relevant skills or experience"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={registrationData.specialRequirements}
                    onChange={(e) => setRegistrationData((prev) => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any special requirements or accessibility needs"
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              // Team Registration Form
              <div className="space-y-6">
                <div>
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={registrationData.teamName}
                    onChange={(e) => setRegistrationData((prev) => ({ ...prev, teamName: e.target.value }))}
                    placeholder="Enter your team name"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Team Members</h3>
                    {registrationData.teamMembers.length < 8 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTeamMember}
                        className="text-indigo-600 border-indigo-200 bg-transparent"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {registrationData.teamMembers.map((member, index) => (
                      <Card key={index} className="border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Member {index + 1}</h4>
                          {registrationData.teamMembers.length > (event?.team_size === "2_people" ? 2 : 4) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                              placeholder="Full name"
                              required
                            />
                          </div>
                          <div>
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={member.email}
                              onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                              placeholder="Email address"
                              required
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={member.phone}
                              onChange={(e) => updateTeamMember(index, "phone", e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <Label>College</Label>
                            <Input
                              value={member.college}
                              onChange={(e) => updateTeamMember(index, "college", e.target.value)}
                              placeholder="College/University"
                            />
                          </div>
                          <div>
                            <Label>Branch/Department</Label>
                            <Input
                              value={member.branch}
                              onChange={(e) => updateTeamMember(index, "branch", e.target.value)}
                              placeholder="e.g., Computer Science"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="teamRequirements">Special Requirements</Label>
                  <Textarea
                    id="teamRequirements"
                    value={registrationData.specialRequirements}
                    onChange={(e) => setRegistrationData((prev) => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any special requirements for the team"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistrationDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRegistration}
                disabled={registering}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {registering ? "Registering..." : "Complete Registration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
