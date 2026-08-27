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
  Plus,
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
  
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write')
  const [customQuestions, setCustomQuestions] = useState<any[]>([])

  const insertMarkdown = (markup: string) => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const selected = text.substring(start, end)
    
    let replacement = ''
    if (markup === 'bold') replacement = `**${selected || 'bold text'}**`
    else if (markup === 'italic') replacement = `*${selected || 'italic text'}*`
    else if (markup === 'header') replacement = `### ${selected || 'Heading'}`
    else if (markup === 'list') replacement = `\n- ${selected || 'List item'}`

    const newValue = before + replacement + after
    handleInputChange('description', newValue)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 50)
  }

  const renderFormattedPreview = (text: string) => {
    if (!text) return null
    const paragraphs = text.split('\n')
    return paragraphs.map((p, idx) => {
      const isListItem = p.trim().startsWith('- ') || p.trim().startsWith('* ')
      let content = p
      if (isListItem) {
        content = p.trim().substring(2)
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = []
      let lastIndex = 0
      let match
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex))
      }
      
      const renderedContent = parts.length > 0 ? parts : content
      
      if (isListItem) {
        return (
          <li key={idx} className="ml-6 list-disc text-slate-700 mb-1 text-sm">
            {renderedContent}
          </li>
        )
      }
      return (
        <p key={idx} className="mb-3 text-sm min-h-[1rem]">
          {renderedContent}
        </p>
      )
    })
  }

  const addCustomQuestion = () => {
    setCustomQuestions(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        label: "",
        type: "text",
        required: false,
        options: []
      }
    ])
  }

  const updateCustomQuestion = (id: string, key: string, val: any) => {
    setCustomQuestions(prev => prev.map(q => q.id === id ? { ...q, [key]: val } : q))
  }

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id))
  }

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
        type: formData.type as any,
        mode: formData.mode as any,
        venue: formData.venue.trim() || null,
        start_date: startDateTime,
        end_date: endDateTime,
        registration_deadline: registrationDeadline,
        max_participants: formData.maxParticipants ? Number.parseInt(formData.maxParticipants) : null,
        current_participants: 0,
        entry_fee: formData.entryFee ? Number.parseFloat(formData.entryFee) : 0,
        prize_pool: formData.prizePool ? Number.parseFloat(formData.prizePool) : null,
        status: (isDraft ? "draft" : "published") as any,
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
          custom_questions: customQuestions
        },
        team_size: formData.teamSize as any,
        level: formData.level as any,
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
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button matching platform visual language */}
        <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link href="/dashboard/organizer/host">
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 font-semibold text-slate-700 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Event Hub
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create New Event</h1>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Creator
                </Badge>
              </div>
              <p className="text-gray-600 font-medium text-lg">
                Create an engaging event for your campus community.
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 px-5 py-2.5 text-sm font-semibold rounded-full shrink-0 border w-fit">
            Status: {submitStatus === "success" ? "Published" : "Draft"}
          </Badge>
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
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Basic Information
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Provide the essential details about your event
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Event Banner</Label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/30 rounded-2xl p-8 transition-all">
                  {bannerPreview ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={bannerPreview || "/placeholder.svg"}
                        alt="Banner preview"
                        className="w-full h-56 object-cover rounded-2xl"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-3 right-3 rounded-xl shadow-md"
                        onClick={removeBanner}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">Upload event banner image</p>
                        <p className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB (Recommended: 800x400px)</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 shadow-sm"
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
                  <Label htmlFor="title" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., AI Workshop 2024"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all h-11 text-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Club / Organization
                  </Label>
                  <div className="flex items-center h-11 px-4 border border-indigo-100 bg-indigo-50/40 rounded-xl">
                    <Badge className="bg-indigo-600 text-white font-semibold rounded-lg px-3 py-1">
                      {selectedClubName || 'Loading...'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Event Description *
                </Label>
                
                {/* Description Formatting Toolbar */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 border-b-0 rounded-t-xl px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('bold')}
                      className="h-8 w-8 p-0 font-bold hover:bg-slate-200 text-xs text-slate-700 rounded-lg"
                      title="Bold Text"
                    >
                      B
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('italic')}
                      className="h-8 w-8 p-0 italic hover:bg-slate-200 text-xs text-slate-700 font-serif rounded-lg"
                      title="Italic Text"
                    >
                      I
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('header')}
                      className="h-8 w-8 p-0 font-black hover:bg-slate-200 text-xs text-slate-700 rounded-lg"
                      title="Heading"
                    >
                      H
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('list')}
                      className="h-8 w-8 p-0 hover:bg-slate-200 text-xs text-slate-700 font-mono font-bold rounded-lg"
                      title="Bullet List"
                    >
                      •-
                    </Button>
                  </div>
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setDescTab('write')}
                      className={`px-3 py-1 font-semibold transition ${descTab === 'write' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('preview')}
                      className={`px-3 py-1 font-semibold transition ${descTab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {descTab === 'write' ? (
                  <Textarea
                    id="description"
                    placeholder="Describe your event in detail... (Use markdown formatting buttons above)"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="border-slate-200 rounded-b-xl rounded-t-none focus:border-indigo-500 focus:ring-indigo-500 min-h-[140px] bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
                    required
                  />
                ) : (
                  <div className="border border-slate-200 rounded-b-xl p-4 bg-slate-50/30 min-h-[140px] text-sm text-slate-800 leading-relaxed overflow-y-auto max-h-[250px]">
                    {formData.description ? (
                      renderFormattedPreview(formData.description)
                    ) : (
                      <span className="text-slate-400 italic text-xs">No description written yet</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white h-11">
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
                  <Label htmlFor="type" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Event Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white h-11">
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
                  <Label htmlFor="level" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Difficulty Level
                  </Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white h-11">
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
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  Event Details & Logistics
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Configure the timing, location, and logistics for your event
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Event Mode *
                  </Label>
                  <Select value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white h-11">
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
                  <Label htmlFor="venue" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Venue / Location {formData.mode !== "online" && "*"}
                  </Label>
                  <Input
                    id="venue"
                    placeholder={
                      formData.mode === "online"
                        ? "Meeting link will be shared with registered students"
                        : "e.g., Main Auditorium, Campus Hall A"
                    }
                    value={formData.venue}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white h-11"
                    required={formData.mode !== "online"}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date & Time *</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="startDate" className="text-[11px] font-semibold text-slate-500">
                        Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="startTime" className="text-[11px] font-semibold text-slate-500">
                        Time
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Date & Time (Optional)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-[11px] font-semibold text-slate-500">
                        Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endTime" className="text-[11px] font-semibold text-slate-500">
                        Time
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Registration Deadline *
                </Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11 max-w-xs"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Participation & Pricing */}
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  Participation & Pricing
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Set participation limits, team requirements, and pricing details
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Max Participants
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Team Size
                  </Label>
                  <Select value={formData.teamSize} onValueChange={(value) => handleInputChange("teamSize", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11">
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
                  <Label htmlFor="entryFee" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Entry Fee (₹)
                  </Label>
                  <Input
                    id="entryFee"
                    type="number"
                    placeholder="0 for free"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange("entryFee", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Prize Pool (₹) - Optional
                </Label>
                <Input
                  id="prizePool"
                  type="number"
                  placeholder="e.g., 10000"
                  value={formData.prizePool}
                  onChange={(e) => handleInputChange("prizePool", e.target.value)}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11 max-w-xs"
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <Tag className="h-5 w-5" />
                  </div>
                  Additional Information
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Add tags, requirements, and other relevant details
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g., AI, Machine Learning, Workshop, Beginner"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Requirements & Prerequisites (one per line)
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g.,&#10;Basic programming knowledge&#10;Laptop with Python installed&#10;Enthusiasm to learn"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information & Settings */}
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <Settings className="h-5 w-5" />
                  </div>
                  Contact Information & Settings
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Provide contact details and configure event features
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="organizer@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-slate-50/50 h-11"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Features</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-slate-800">QR Code Attendance</div>
                      <div className="text-xs text-slate-500">
                        Enable QR check-in scanner for live attendance
                      </div>
                    </div>
                    <Switch
                      checked={formData.enableQR}
                      onCheckedChange={(checked) => handleInputChange("enableQR", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-slate-800">Digital Certificates</div>
                      <div className="text-xs text-slate-500">
                        Auto-issue certificates to attended participants
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

          {/* Custom Questions Section (Google Forms feature) */}
          <Card className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm space-y-6">
            <CardHeader className="p-0 border-b border-slate-100 pb-6 flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl font-black text-slate-900 tracking-tight">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-3 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  Custom Registration Fields
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                  Ask custom questions (like GitHub link, T-Shirt Size, or portfolio) during student registration.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-2">
              {customQuestions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                  <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No custom questions added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Students will only fill standard student profile details</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customQuestions.map((q, idx) => (
                    <div key={q.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col gap-4 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeCustomQuestion(q.id)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Question Label *</Label>
                          <Input
                            placeholder="e.g. GitHub Repository Link"
                            value={q.label}
                            onChange={(e) => updateCustomQuestion(q.id, 'label', e.target.value)}
                            className="border-slate-200 rounded-xl h-10 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Field Type *</Label>
                          <Select
                            value={q.type}
                            onValueChange={(val) => updateCustomQuestion(q.id, 'type', val)}
                          >
                            <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short Answer (Text)</SelectItem>
                              <SelectItem value="number">Numeric Input</SelectItem>
                              <SelectItem value="select">Dropdown Choice</SelectItem>
                              <SelectItem value="checkbox">Checkbox Switch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-6 pt-5">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`req-${q.id}`}
                              checked={q.required}
                              onCheckedChange={(val) => updateCustomQuestion(q.id, 'required', val)}
                            />
                            <Label htmlFor={`req-${q.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">Required</Label>
                          </div>
                        </div>
                      </div>

                      {q.type === 'select' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Options (Comma separated) *</Label>
                          <Input
                            placeholder="e.g. Small, Medium, Large"
                            value={q.options ? q.options.join(', ') : ''}
                            onChange={(e) => updateCustomQuestion(q.id, 'options', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                            className="border-slate-200 rounded-xl h-10 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                onClick={addCustomQuestion}
                variant="outline"
                className="border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 font-semibold w-full py-6 rounded-2xl hover:bg-indigo-50/50 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Custom Question
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end items-center space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              className="px-8 py-3.5 border border-slate-200 hover:bg-slate-100 rounded-full font-bold text-slate-700 bg-white shadow-sm transition-all"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              className="px-10 py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Publishing..." : "Publish Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
