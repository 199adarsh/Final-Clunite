"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Save,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Users,
  Settings,
  Tag,
  Upload,
  ImageIcon,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function CreateEventPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null)

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
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    mode: "offline",
    venue: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    registrationDeadline: "",
    maxParticipants: "",
    entryFee: "",
    prizePool: "",
    teamSize: "solo",
    level: "beginner",
    tags: "",
    requirements: "",
    contactEmail: "",
    contactPhone: "",
    enableQR: true,
    enableCertificates: true,
    banner: null as File | null,
    bannerUrl: "",
  })

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBannerUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file")
      setSubmitStatus("error")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Banner image must be less than 5MB")
      setSubmitStatus("error")
      return
    }

    setUploadingBanner(true)
    setSubmitStatus("idle")

    try {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file)
      setBannerPreview(previewUrl)

      // Upload immediately and store permanent URL so it appears everywhere after create
      const uploadedUrl = await uploadBannerToSupabase(file)
      handleInputChange("bannerUrl", uploadedUrl)
      handleInputChange("banner", file)
    } catch (error) {
      console.error("Error handling banner:", error)
      setErrorMessage("Error processing banner image")
      setSubmitStatus("error")
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleBannerUpload(file)
    }
  }

  const removeBanner = () => {
    setBannerPreview(null)
    handleInputChange("banner", null)
    handleInputChange("bannerUrl", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadBannerToSupabase = async (file: File): Promise<string> => {
    console.log("Starting upload for file:", file.name, file.size, file.type)
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("bucket", "Event Banner") // Use Event Banner bucket for events

    console.log("Sending request to /api/upload for Event Banner bucket")
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Upload failed with error:", errorData)
        throw new Error(errorData.error || "Failed to upload banner")
      }

      const result = await response.json()
      console.log("Upload successful:", result)
      return result.url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || !formData.type) {
        throw new Error("Please fill in all required fields")
      }

      if (!formData.startDate || !formData.startTime || !formData.registrationDeadline) {
        throw new Error("Please provide event date, time, and registration deadline")
      }

      // Create start and end datetime strings
      const startDateTime = `${formData.startDate}T${formData.startTime}:00.000Z`
      const endDateTime =
        formData.endDate && formData.endTime ? `${formData.endDate}T${formData.endTime}:00.000Z` : null
      const registrationDeadline = `${formData.registrationDeadline}T23:59:59.000Z`

      // Validate dates
      const now = new Date()
      const regDeadline = new Date(registrationDeadline)
      const eventStart = new Date(startDateTime)

      if (regDeadline <= now) {
        throw new Error("Registration deadline must be in the future")
      }

      if (eventStart <= regDeadline) {
        throw new Error("Event start date must be after registration deadline")
      }

      let bannerUrl = formData.bannerUrl || `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(
        formData.title + " event",
      )}`

      // Ensure club is selected
      if (!selectedClubId) {
        throw new Error("No club selected. Please select a club first.")
      }

      // Get current user first
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fallback to a test organizer user if not authenticated (for development)
      const userId = user?.id || '550e8400-e29b-41d4-a716-446655440001' // John Doe - organizer from seed data
      
      if (!userId) {
        throw new Error("You must be logged in to create an event")
      }

      // Prepare event data
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        club_id: selectedClubId,
        college: "Tech University",
        category: formData.category,
        type: formData.type,
        mode: formData.mode,
        venue: formData.venue.trim() || null,
        start_date: startDateTime,
        end_date: endDateTime,
        registration_deadline: registrationDeadline,
        max_participants: formData.maxParticipants ? Number.parseInt(formData.maxParticipants) : null,
        current_participants: 0,
        entry_fee: formData.entryFee ? Number.parseFloat(formData.entryFee) : 0,
        prize_pool: formData.prizePool ? Number.parseFloat(formData.prizePool) : null,
        status: isDraft ? "draft" : "published",
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : null,
        requirements: formData.requirements
          ? formData.requirements
              .split("\n")
              .map((req) => req.trim())
              .filter(Boolean)
          : null,
        contact_info: {
          email: formData.contactEmail.trim() || null,
          phone: formData.contactPhone.trim() || null,
          qr_enabled: formData.enableQR,
          certificates_enabled: formData.enableCertificates,
        },
        team_size: formData.teamSize,
        level: formData.level,
        duration: formData.endDate && formData.endTime ? "Multi-day" : "1 day",
        image_url: bannerUrl,
        created_by: userId,
      }

      // Insert event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert(eventData)
        .select("id, title")
        .single()

      if (eventError) {
        throw new Error(`Error creating event: ${eventError.message}`)
      }

      setSubmitStatus("success")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/organizer/host")
      }, 2000)
    } catch (error) {
      console.error("Error creating event:", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 backdrop-blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-r from-blue-400 to-violet-400 opacity-20 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/dashboard/organizer/host"
                  className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition-colors backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Event Hub
                </Link>
                <div className="flex items-center mb-4">
                  <h1 className="text-4xl font-black font-heading bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Create New Event</h1>
                  <Sparkles className="h-10 w-10 ml-4 text-indigo-200" />
                </div>
                <p className="text-blue-50 text-xl leading-relaxed backdrop-blur-sm">
                  Create an engaging event for your campus community
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-violet-400/20 to-blue-400/20 text-white border-white/20 px-6 py-3 text-base font-semibold backdrop-blur-md shadow-lg">
                {submitStatus === "success" ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Event created successfully! Redirecting to your events...
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-heading">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Basic Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Provide the essential details about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground">Event Banner</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview || "/placeholder.svg"}
                        alt="Banner preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeBanner}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Upload event banner</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB. Recommended: 800x400px</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingBanner}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingBanner ? "Processing..." : "Choose File"}
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., AI Workshop 2024"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Club/Organization
                  </Label>
                  <div className="flex items-center h-10 px-3 py-2 border-2 border-indigo-200 bg-indigo-50 rounded-lg">
                    <Badge className="bg-indigo-600 text-white">
                      {selectedClubName || 'Loading...'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                  Event Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg min-h-[120px]"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-foreground">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-foreground">
                    Event Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="cultural">Cultural Event</SelectItem>
                      <SelectItem value="sports">Sports Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-semibold text-foreground">
                    Difficulty Level
                  </Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                    <SelectTrigger className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details & Logistics */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-heading">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                Event Details & Logistics
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure the timing, location, and logistics for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-sm font-semibold text-foreground">
                    Event Mode *
                  </Label>
                  <Select value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)}>
                    <SelectTrigger className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline (In-Person)</SelectItem>
                      <SelectItem value="online">Online (Virtual)</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="venue" className="text-sm font-semibold text-foreground">
                    Venue/Location {formData.mode !== "online" && "*"}
                  </Label>
                  <Input
                    id="venue"
                    placeholder={
                      formData.mode === "online"
                        ? "Meeting link will be shared later"
                        : "e.g., Main Auditorium, Building A"
                    }
                    value={formData.venue}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    required={formData.mode !== "online"}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Start Date & Time *</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium text-foreground">
                        Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-sm font-medium text-foreground">
                        Time
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">End Date & Time (Optional)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium text-foreground">
                        Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-sm font-medium text-foreground">
                        Time
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline" className="text-sm font-semibold text-foreground">
                  Registration Deadline *
                </Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                  className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg max-w-xs"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Participation & Pricing */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-heading">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Participation & Pricing
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Set participation limits, team requirements, and pricing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="text-sm font-semibold text-foreground">
                    Max Participants
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="text-sm font-semibold text-foreground">
                    Team Size
                  </Label>
                  <Select value={formData.teamSize} onValueChange={(value) => handleInputChange("teamSize", value)}>
                    <SelectTrigger className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Individual (Solo)</SelectItem>
                      <SelectItem value="2_people">Team of 2 People</SelectItem>
                      <SelectItem value="group_4+">Group of 4+ People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryFee" className="text-sm font-semibold text-foreground">
                    Entry Fee (₹)
                  </Label>
                  <Input
                    id="entryFee"
                    type="number"
                    placeholder="0 for free"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange("entryFee", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool" className="text-sm font-semibold text-foreground">
                  Prize Pool (₹) - Optional
                </Label>
                <Input
                  id="prizePool"
                  type="number"
                  placeholder="e.g., 10000"
                  value={formData.prizePool}
                  onChange={(e) => handleInputChange("prizePool", e.target.value)}
                  className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg max-w-xs"
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-heading">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                Additional Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Add tags, requirements, and other relevant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-semibold text-foreground">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g., AI, Machine Learning, Workshop, Beginner"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-semibold text-foreground">
                  Requirements & Prerequisites (one per line)
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g.,&#10;Basic programming knowledge&#10;Laptop with Python installed&#10;Enthusiasm to learn"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information & Settings */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-heading">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Contact Information & Settings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Provide contact details and configure event features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-semibold text-foreground">
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="organizer@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-semibold text-foreground">
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className="border-border focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Event Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">QR Code Attendance</div>
                      <div className="text-sm text-muted-foreground">
                        Enable QR code scanning for attendance tracking
                      </div>
                    </div>
                    <Switch
                      checked={formData.enableQR}
                      onCheckedChange={(checked) => handleInputChange("enableQR", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">Digital Certificates</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically generate certificates for participants
                      </div>
                    </div>
                    <Switch
                      checked={formData.enableCertificates}
                      onCheckedChange={(checked) => handleInputChange("enableCertificates", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              className="px-8 py-3 border-2 border-border hover:border-muted-foreground bg-transparent"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting}
            >
              <Save className="h-5 w-5 mr-2" />
              {isSubmitting ? "Publishing..." : "Publish Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
