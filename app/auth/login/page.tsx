"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Calendar,
  Users,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        toast.error("Please fill all fields")
        setLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address")
        setLoading(false)
        return
      }

      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        console.error("Login error:", error)
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before logging in")
        } else {
          toast.error(error.message || "Failed to login")
        }
        setLoading(false)
        return
      }

      toast.success("Welcome back! Redirecting to dashboard...")
      window.location.href = "/dashboard/student"
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error(error.message || "An error occurred during login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT PANEL: Platform Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border-r border-slate-100 relative overflow-hidden">
          {/* Subtle background illustration */}
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
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-bold text-xs border-0">
                  <Sparkles className="h-3 w-3 mr-1" /> Student & Club Portal
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold text-xs border-0">
                  <Award className="h-3 w-3 mr-1" /> Verified Badges
                </Badge>
              </div>

              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Unite. Create. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                  Celebrate your journey.
                </span>
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed">
                Connect with 200+ colleges, join top hackathons, manage student clubs, and collect verified digital certificates.
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
                <h3 className="text-xs font-bold text-slate-900">Smart Event Discovery</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Explore workshops, tech fests, and hackathons tailored to your major.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Verifiable Certificates</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Earn digital credentials with tamper-proof QR codes directly to your profile.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Campus Network</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Join over 50,000+ students and club leads across 200+ universities.</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">A</div>
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">R</div>
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">S</div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">M</div>
              </div>
              <span className="text-xs font-medium text-slate-600">50k+ students registered</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Ecosystem</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Form Container */}
        <div className="col-span-1 lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-white">
          {/* Top Bar for Mobile & Back Link */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to home</span>
            </Link>

            {/* Mobile Brand Header */}
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
          <div className="w-full max-w-sm mx-auto my-auto py-2">
            <div className="mb-7 space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Enter your credentials to access your student dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Email Address
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    autoComplete="current-password"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                    New to Clunite?
                  </span>
                </div>
              </div>

              {/* Signup Link */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/signup"
                    className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-0.5 ml-1"
                  >
                    Create account
                    <ArrowRight className="h-3 w-3 inline" />
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="text-center pt-6 border-t border-slate-100 text-[11px] text-slate-500">
            <p>
              By signing in, you agree to Clunite&apos;s{" "}
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
