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
import { Loader2, Mail, Lock, LogIn, LogOut, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.email || !formData.password) {
        toast.error("Please fill all fields")
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

      // Sign in
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password")
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Please verify your email before logging in")
        } else {
          toast.error(error.message || "Failed to login")
        }
        setLoading(false)
        return
      }

      // Login successful
      console.log('Login successful, redirecting...')
      toast.success("Logged in successfully!")
      
      // Use window.location for hard redirect (more reliable)
      window.location.href = '/dashboard/student'

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || "An error occurred during login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-200 shadow-lg bg-white">
          <CardHeader className="text-center space-y-3 pb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-lg mb-2 mx-auto">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Login to continue managing your campus events
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    Password
                  </Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-11 border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all rounded-lg"
                  autoComplete="current-password"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-lg transition-colors mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login to Dashboard
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">New to Clunite?</span>
                </div>
              </div>

              {/* Signup Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link 
                    href="/auth/signup" 
                    className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-6 text-center space-y-3">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-orange-500 inline-flex items-center gap-1 transition-colors"
          >
            ← Back to Home
          </Link>
          <p className="text-xs text-gray-500">
            Secure login powered by Supabase
          </p>
        </div>
      </div>
    </div>
  )
}
