"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, Mail, Lock, User, Building2, ArrowRight, AlertCircle, GraduationCap, BookOpen } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    college: "",
    branch: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.fullName || !formData.college) {
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
        formData.branch || undefined
      )

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error("This email is already registered. Please login instead.")
        } else {
          toast.error(error.message || "Failed to create account")
        }
        setLoading(false)
        return
      }

      toast.success("Account created successfully!")
      
      // Use window.location for hard redirect
      window.location.href = '/dashboard/student'

    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || "An error occurred during signup")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-200 shadow-lg bg-white">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-lg mb-2 mx-auto">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Join Clunite
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Create your account and start exploring campus events
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-gray-900">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
              </div>

              {/* College */}
              <div className="space-y-2">
                <Label htmlFor="college" className="text-sm font-semibold text-gray-900">
                  College/University *
                </Label>
                <Input
                  id="college"
                  type="text"
                  placeholder="MIT, Stanford, etc."
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  required
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-semibold text-gray-900">
                  Branch/Major
                </Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="Computer Science, Mechanical, etc."
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
                <p className="text-xs text-gray-500">
                  Optional - helps personalize your experience
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-lg transition-colors mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Already a member?</span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    href="/auth/login" 
                    className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-orange-500 hover:text-orange-600">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-orange-500 hover:text-orange-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
