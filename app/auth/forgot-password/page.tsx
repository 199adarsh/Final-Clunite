"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  Mail,
  ArrowRight,
  ChevronLeft,
  KeyRound,
  CheckCircle2
} from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!email) {
        toast.error("Please enter your email address")
        setLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address")
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/student/settings`
      })

      if (error) {
        console.error("Password reset error:", error)
        toast.error(error.message || "Failed to send reset link")
        setLoading(false)
        return
      }

      setSubmitted(true)
      toast.success("Password reset instructions sent to your email!")
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast.error(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Top Back Link */}
        <div className="mb-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to sign in</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm">
          {/* Brand Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
          </div>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center space-y-1.5 mb-7">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Reset Password
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Enter your registered student email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-10 h-11 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold text-slate-900">Check your email</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  We&apos;ve sent a password reset link to <br />
                  <span className="font-semibold text-slate-800">{email}</span>
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Try another email
                </Button>
              </div>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="mt-7 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/auth/login"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Return to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
