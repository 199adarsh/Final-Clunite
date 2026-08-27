"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CollegeAutocomplete } from "@/components/college-autocomplete"
import { BranchAutocomplete } from "@/components/branch-autocomplete"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Award,
  Calendar,
  Users,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  ShieldCheck
} from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    college: "",
    branch: "",
    gender: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.fullName || !formData.college || !formData.gender) {
        toast.error("Please fill all required fields")
        setLoading(false)
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address")
        setLoading(false)
        return
      }

      // Password validation
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters")
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match")
        setLoading(false)
        return
      }

      // Sign up
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.college,
        formData.branch || undefined,
        formData.gender || undefined
      )

      if (error) {
        if (error.message && error.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.")
        } else {
          toast.error(error.message || "Failed to create account")
        }
        setLoading(false)
        return
      }

      toast.success("Account created successfully! Welcome to Clunite.")
      window.location.href = "/dashboard/student"
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error.message || "An error occurred during signup")
      setLoading(false)
    }
  }

  const isPasswordValid = formData.password.length >= 8
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
        {/* LEFT PANEL: Platform Showcase */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border-r border-slate-100 relative overflow-hidden">
          {/* Ambient blur */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />

          {/* Brand Header */}
          <div className="space-y-6 relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-base tracking-tight transition-transform group-hover:scale-105">
                CL
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Clunite
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 tracking-wide uppercase">
                  Campus Platform
                </span>
              </div>
            </Link>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-xs border-0">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Student Registration
                </Badge>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border-0">
                  <Sparkles className="h-3 w-3 mr-1" /> Free Forever
                </Badge>
              </div>

              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Start your campus <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                  adventure today.
                </span>
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed">
                Join over 50,000 students discovering hackathons, workshops, campus clubs, and verified credentials.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3.5 my-6 relative z-10">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Instant Event Passes</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Register with one click and get automated QR passes on your device.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Verified Credentials</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Build a verified portfolio of achievements recognized across campus.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Clubs & Community</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Join official clubs in your college or form inter-college teams.</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between relative z-10">
            <span className="text-xs font-medium text-slate-600">Free for all college students</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>200+ Colleges</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Form Container */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-white overflow-y-auto">
          {/* Top Bar for Mobile & Back Link */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to home</span>
            </Link>

            {/* Mobile Brand */}
            <div className="lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  CL
                </div>
                <span className="font-extrabold text-slate-900 text-sm">Clunite</span>
              </Link>
            </div>
          </div>

          {/* Form Area */}
          <div className="w-full max-w-lg mx-auto my-auto py-2">
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Join Clunite
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Create your student account to discover campus events and hackathons
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label
                    htmlFor="fullName"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Full Name <span className="text-indigo-600">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                      autoComplete="name"
                      className="pl-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Email Address <span className="text-indigo-600">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@college.edu"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      autoComplete="email"
                      className="pl-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: College Search Autocomplete */}
              <div className="space-y-1">
                <Label
                  htmlFor="college"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  College / University <span className="text-indigo-600">*</span>
                </Label>
                <CollegeAutocomplete
                  id="college"
                  placeholder="Search and select your college..."
                  value={formData.college}
                  onChange={(val) => setFormData({ ...formData, college: val })}
                  required
                  leftIcon={
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                  }
                  className="pl-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                />
              </div>

              {/* Row 3: Branch & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Branch */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="branch"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Branch / Major
                    </Label>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </div>
                  <BranchAutocomplete
                    id="branch"
                    placeholder="Search or pick your branch..."
                    value={formData.branch}
                    onChange={(val) => setFormData({ ...formData, branch: val })}
                    className="h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <Label
                    htmlFor="gender"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Gender <span className="text-indigo-600">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                    required
                  >
                    <SelectTrigger className="h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl shadow-lg">
                      <SelectItem value="male" className="focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">
                        Male
                      </SelectItem>
                      <SelectItem value="female" className="focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">
                        Female
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Password */}
                <div className="space-y-1">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password <span className="text-indigo-600">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pl-10 pr-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Confirm Password <span className="text-indigo-600">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value
                        })
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pl-10 pr-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password indicator */}
              {formData.password.length > 0 && (
                <div className="flex items-center gap-3 text-[11px] pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      isPasswordValid ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    8+ characters
                  </span>
                  {formData.confirmPassword.length > 0 && (
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        doPasswordsMatch ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doPasswordsMatch ? "Passwords match" : "Passwords do not match"}
                    </span>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Student Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                    Already registered?
                  </span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-0.5 ml-1"
                  >
                    Sign in here
                    <ArrowRight className="h-3 w-3 inline" />
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <p>
              By creating an account, you agree to Clunite&apos;s{" "}
              <Link href="/terms" className="text-slate-700 hover:text-indigo-600 font-medium underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-slate-700 hover:text-indigo-600 font-medium underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
