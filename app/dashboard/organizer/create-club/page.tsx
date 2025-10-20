"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ensureUserExists } from "@/lib/sync-user"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Building2, Mail, User, Calendar, Shield, Image as ImageIcon, Upload, X } from "lucide-react"

export default function CreateClubPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bannerUrl, setBannerUrl] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    vision: "",
    category: "",
    college: "",
    founding_date: "",
    contact_email: "",
    official_email: "",
    faculty_in_charge: "",
    president_name: "",
    president_email: "",
    president_phone: "",
  })

  const categories = [
    "Technical",
    "Cultural",
    "Sports",
    "Literary",
    "Social Service",
    "Entrepreneurship",
    "Arts",
    "Music",
    "Dance",
    "Drama",
    "Photography",
    "Other"
  ]

  const generatePIN = async () => {
    // Characters to use: digits only (0-9)
    const chars = '0123456789'
    let pin = ''
    
    // Generate a unique 8-digit PIN
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate random 8-digit PIN
      pin = ''
      for (let i = 0; i < 8; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      // Check if PIN already exists in database
      const { data, error } = await supabase
        .from('pending_clubs')
        .select('pin')
        .eq('pin', pin)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking PIN uniqueness:', error)
        // Continue anyway if there's an error
        isUnique = true
      } else if (!data) {
        // PIN doesn't exist, it's unique
        isUnique = true
      }
      
      attempts++
    }
    
    return pin
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Convert image to base64 and store temporarily (don't upload to database yet)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setBannerUrl(base64String) // Show preview
        // Store file info for later upload
        sessionStorage.setItem('pendingBannerFile', JSON.stringify({
          data: base64String,
          type: file.type,
          name: file.name
        }))
        toast.success('Banner ready! Will be uploaded after verification.')
        setUploading(false)
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Failed to process banner: ${error.message}`)
      setUploading(false)
    }
  }

  const sendPINEmail = async (email: string, clubName: string, pin: string) => {
    try {
      const response = await fetch('/api/send-club-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clubName, pin })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to send PIN email:', errorData)
        toast.error(`Email service error: ${errorData.error || 'Failed to send PIN'}`)
        return false
      }
      
      return true
    } catch (error: any) {
      console.error('Failed to send email:', error)
      toast.error(`Network error while sending PIN: ${error.message}`)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.college || !formData.official_email) {
        toast.error("Please fill all required fields")
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.official_email)) {
        toast.error("Please enter a valid email address")
        setLoading(false)
        return
      }

      // Check authentication
      if (!authUser) {
        toast.error("You must be logged in to create a club")
        setLoading(false)
        return
      }

      // Ensure user exists in database (prevent foreign key errors)
      console.log('Ensuring user exists in database...')
      const userSyncResult = await ensureUserExists(authUser, { college: formData.college })
      
      if (!userSyncResult.success) {
        console.error('Failed to sync user:', userSyncResult.error)
        toast.error("Failed to verify user account. Please try again.")
        setLoading(false)
        return
      }

      console.log('Creating club for user:', authUser.id)

      // Generate unique 8-digit PIN
      const clubPIN = await generatePIN()

      // Store pending club in database with PIN
      const { data: pendingClub, error: pendingError } = await supabase
        .from('pending_clubs')
        .insert({
          pin: clubPIN,
          official_email: formData.official_email,
          president_name: formData.president_name,
          president_email: formData.president_email,
          president_phone: formData.president_phone,
          status: 'pending',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          created_by: authUser.id,
          used_count: 0,
          max_uses: 5,
          club_data: {
            name: formData.name,
            tagline: formData.tagline,
            description: formData.description,
            vision: formData.vision,
            category: formData.category,
            college: formData.college,
            founding_date: formData.founding_date || null,
            contact_email: formData.official_email,
            faculty_in_charge: formData.faculty_in_charge,
          }
        })
        .select()
        .single()

      if (pendingError || !pendingClub) {
        console.error('Failed to store pending club:', pendingError)
        toast.error('Failed to prepare club data. Please try again.')
        setLoading(false)
        return
      }

      // Store pending club ID in sessionStorage for verification
      sessionStorage.setItem('pendingClubId', pendingClub.id)
      console.log('Club data stored in database, awaiting PIN verification')

      // Send PIN via email (non-blocking - don't wait)
      sendPINEmail(formData.official_email, formData.name, clubPIN)
        .then(sent => {
          if (sent) {
            console.log('PIN email sent successfully')
          } else {
            console.log('PIN email failed')
          }
        })
        .catch(err => console.error('Email error:', err))

      // Show success message (PIN only sent to email, not displayed)
      toast.success(`Club data prepared!`, {
        duration: 5000
      })
      toast.info(`Verification PIN has been sent to ${formData.official_email}. Club and banner will be created after verification.`, {
        duration: 8000
      })

      // Redirect to PIN verification page
      setTimeout(() => {
        router.push(`/dashboard/organizer/verify-club`)
      }, 2000)

    } catch (error: any) {
      console.error('Error creating club:', error)
      const errorMessage = error.message || error.toString() || "Unknown error occurred"
      toast.error(`Failed to create club: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 py-12 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-4 shadow-2xl">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Create Your Club
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Register your club and receive an 8-digit PIN via email to unlock organizer access
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Basic Information</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Club Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Tech Innovators Club"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-slate-700">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-sm font-semibold text-slate-700">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="A short catchy phrase about your club"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your club's mission and activities"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="border-2 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision" className="text-sm font-semibold text-slate-700">Vision</Label>
                <Textarea
                  id="vision"
                  placeholder="Your club's long-term vision and goals"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  rows={3}
                  className="border-2 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Club Banner Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                  Club Banner (Optional)
                </Label>
                
                {bannerUrl ? (
                  <div className="relative group">
                    <img 
                      src={bannerUrl} 
                      alt="Club banner" 
                      className="w-full h-48 object-cover rounded-xl border-2 border-indigo-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setBannerUrl("")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                    <input
                      type="file"
                      id="banner-upload"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="banner-upload" 
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {uploading ? 'Uploading...' : 'Click to upload club banner'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG up to 5MB (Recommended: 1200x400px)
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* College & Contact */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">College & Contact Information</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="college" className="text-sm font-semibold text-slate-700">College/University *</Label>
                  <Input
                    id="college"
                    placeholder="e.g., MIT, Stanford"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    required
                    className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founding_date" className="text-sm font-semibold text-slate-700">Founding Date</Label>
                  <Input
                    id="founding_date"
                    type="date"
                    value={formData.founding_date}
                    onChange={(e) => setFormData({ ...formData, founding_date: e.target.value })}
                    className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="official_email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Official Club Email * (PIN will be sent here)
                </Label>
                <Input
                  id="official_email"
                  type="email"
                  placeholder="club@college.edu"
                  value={formData.official_email}
                  onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                  required
                  className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-sm text-indigo-600 font-medium">
                  📧 This email will receive the 8-digit PIN for club verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty_in_charge" className="text-sm font-semibold text-slate-700">Faculty In-Charge</Label>
                <Input
                  id="faculty_in_charge"
                  placeholder="Prof. John Doe"
                  value={formData.faculty_in_charge}
                  onChange={(e) => setFormData({ ...formData, faculty_in_charge: e.target.value })}
                  className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* President Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">President Information</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="president_name" className="text-sm font-semibold text-slate-700">President Name</Label>
                  <Input
                    id="president_name"
                    placeholder="Full name"
                    value={formData.president_name}
                    onChange={(e) => setFormData({ ...formData, president_name: e.target.value })}
                    className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="president_email" className="text-sm font-semibold text-slate-700">President Email</Label>
                  <Input
                    id="president_email"
                    type="email"
                    placeholder="president@email.com"
                    value={formData.president_email}
                    onChange={(e) => setFormData({ ...formData, president_email: e.target.value })}
                    className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="president_phone" className="text-sm font-semibold text-slate-700">President Phone</Label>
                <Input
                  id="president_phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.president_phone}
                  onChange={(e) => setFormData({ ...formData, president_phone: e.target.value })}
                  className="h-12 border-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Club...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Create Club & Get PIN
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full h-12 border-2"
              >
                Cancel
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
              <p className="text-sm text-slate-700 text-center font-medium">
                ✉️ After submission, you'll receive an <strong>8-digit PIN</strong> via email. Use this PIN to verify your club and gain organizer access.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
