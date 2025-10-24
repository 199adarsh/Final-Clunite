"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Award,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Play,
  Plus,
  ChevronRight,
  CheckCircle,
  Star,
  Shield,
  Globe,
  BarChart3,
  Trophy,
  Heart,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Target,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [counter, setCounter] = useState(0)
  const counterRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [activeTab, setActiveTab] = useState("students")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Animated counter effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const end = 50000
          const duration = 2000
          const increment = end / (duration / 16)
          
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCounter(end)
              clearInterval(timer)
            } else {
              setCounter(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => observer.disconnect()
  }, [hasAnimated])

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Success Stories", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ]

  const features = [
    {
      icon: Calendar,
      title: "Smart Event Discovery",
      description: "AI-powered recommendations help you find events that match your interests and skill level.",
      color: "bg-blue-600",
    },
    {
      icon: Users,
      title: "Team Formation",
      description: "Connect with like-minded students and form teams for competitions and projects.",
      color: "bg-emerald-600",
    },
    {
      icon: Trophy,
      title: "Achievement Tracking",
      description: "Earn certificates, badges, and build your portfolio with every event you participate in.",
      color: "bg-amber-600",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your progress, see your growth, and get insights into your learning journey.",
      color: "bg-violet-600",
    },
    {
      icon: Shield,
      title: "Verified Events",
      description: "All events are verified by our team to ensure quality and authenticity.",
      color: "bg-rose-600",
    },
    {
      icon: Globe,
      title: "Multi-Campus Network",
      description: "Connect with students from 200+ colleges across India and participate in inter-college events.",
      color: "bg-cyan-600",
    },
  ]

  const pricingPlans = [
    {
      name: "Student",
      price: "Free",
      description: "Perfect for students looking to discover and participate in events",
      features: [
        "Browse unlimited events",
        "Join up to 5 events per month",
        "Basic profile and certificates",
        "Community access",
        "Mobile app access",
      ],
      popular: false,
      cta: "Get Started Free",
    },
    {
      name: "Organizer",
      price: "₹999",
      period: "/month",
      description: "Ideal for clubs and organizations hosting regular events",
      features: [
        "Host unlimited events",
        "Advanced analytics dashboard",
        "Custom branding options",
        "Priority support",
        "QR code attendance",
        "Certificate generation",
        "Revenue management",
      ],
      popular: true,
      cta: "Start Free Trial",
    },
    {
      name: "Institution",
      price: "Custom",
      description: "Comprehensive solution for colleges and universities",
      features: [
        "Multi-department management",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced reporting",
        "White-label solution",
        "API access",
        "24/7 support",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ]

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Computer Science Student",
      college: "IIT Delhi",
      content:
        "Clunite helped me discover amazing hackathons and workshops. I've participated in 12 events this year and won 3 competitions!",
      rating: 5,
      avatar: "PS",
    },
    {
      name: "Rahul Gupta",
      role: "Event Organizer",
      college: "BITS Pilani",
      content:
        "Managing events has never been easier. The analytics dashboard gives us incredible insights into participant engagement.",
      rating: 5,
      avatar: "RG",
    },
    {
      name: "Dr. Anjali Mehta",
      role: "Dean of Student Affairs",
      college: "NIT Trichy",
      content:
        "Clunite has transformed how we manage campus events. Student participation has increased by 40% since we started using it.",
      rating: 5,
      avatar: "AM",
    },
    {
      name: "Arjun Patel",
      role: "Startup Founder",
      college: "IIM Ahmedabad",
      content:
        "I discovered my co-founder through a startup competition on Clunite. The platform truly connects the right people!",
      rating: 5,
      avatar: "AP",
    },
  ]

  const faqs = [
    {
      question: "How do I get started with Clunite?",
      answer:
        "Simply sign up with your college email address and start exploring events immediately. It's completely free for students!",
    },
    {
      question: "Can I host events on Clunite?",
      answer:
        "Yes! You can start with our free organizer account to host small events, or upgrade to our paid plan for advanced features and unlimited events.",
    },
    {
      question: "Are the events verified?",
      answer:
        "Absolutely. Our team verifies all events and organizers to ensure quality and authenticity. We also have a rating system for additional transparency.",
    },
    {
      question: "Can I participate in events from other colleges?",
      answer:
        "Yes! Many events are open to students from multiple colleges. You can filter events to see which ones accept inter-college participation.",
    },
    {
      question: "Do I get certificates for participating?",
      answer:
        "Most events provide digital certificates upon completion. These are automatically added to your Clunite profile and can be downloaded anytime.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "Yes! Our mobile app is available for both iOS and Android, allowing you to discover events, register, and stay updated on the go.",
    },
    {
      question: "How does the team formation feature work?",
      answer:
        "You can create or join teams for events that require group participation. Our matching algorithm suggests compatible teammates based on skills and interests.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit/debit cards, UPI, net banking, and digital wallets. All transactions are secure and encrypted.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#FBF7F4] overflow-hidden">
      {/* Zapier-style Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo + Nav at extreme left */}
            <div className="flex items-center space-x-8">
              {/* Simple Professional Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Clunite
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right side - CTAs at extreme right */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 text-sm"
                >
                  Explore events
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 text-sm"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors">
                  Sign up
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute block w-6 h-0.5 bg-gray-700 transition-all duration-200 ${
                    isMobileMenuOpen ? "rotate-45 top-3" : "top-1"
                  }`}
                ></span>
                <span
                  className={`absolute block w-6 h-0.5 bg-gray-700 top-3 transition-all duration-200 ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`absolute block w-6 h-0.5 bg-gray-700 transition-all duration-200 ${
                    isMobileMenuOpen ? "-rotate-45 top-3" : "top-5"
                  }`}
                ></span>
              </div>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="py-4 space-y-1 bg-white border-t border-gray-200">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 pt-4 space-y-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full text-base font-semibold"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold">
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Zapier Style with Illustration */}
      <section className="relative pt-32 pb-20 px-6 bg-[#FBF7F4]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-6">
                <span className="text-sm font-bold tracking-wider text-orange-500 uppercase">Campus Events Made Simple</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] text-gray-900">
                The most connected<br />
                campus events platform
              </h1>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed max-w-xl">
                Discover events, join clubs, and build your campus experience across 200+ colleges in India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-md transition-all hover:shadow-lg"
                  >
                    Start free with email
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 text-lg font-semibold rounded-md transition-all"
                  >
                    Start free with Google
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Illustration Area */}
            <div className="relative h-[500px] hidden lg:block">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Abstract illustration with better animations */}
                <div className="relative w-full h-full">
                  {/* Main large circle - pulsing */}
                  <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full opacity-20 animate-pulse"></div>
                  
                  {/* Secondary circle - floating */}
                  <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full opacity-30 animate-float"></div>
                  
                  {/* Central box - rotating slowly */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-gray-900 rounded-2xl rotate-12 animate-float" style={{animationDuration: '8s'}}></div>
                  
                  {/* Small accent squares */}
                  <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-orange-500 rounded-lg shadow-lg animate-float" style={{animationDelay: '1s', animationDuration: '5s'}}></div>
                  <div className="absolute top-1/3 left-1/3 w-12 h-12 bg-orange-400 rounded shadow-md animate-float" style={{animationDelay: '2s', animationDuration: '6s'}}></div>
                  
                  {/* Connecting lines effect */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-orange-200 rounded-full opacity-30"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-orange-300 rounded-full opacity-40 animate-pulse" style={{animationDuration: '3s'}}></div>
                  
                  {/* Small dots */}
                  <div className="absolute top-20 right-20 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-20 left-20 w-3 h-3 bg-orange-600 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute top-40 left-40 w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Stats Section - Like Zapier */}
      <section className="relative py-24 px-6 bg-gray-900 text-white overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12">
            <span className="text-sm font-bold tracking-wider text-orange-500 uppercase">Real campus engagement. Real results.</span>
          </div>
          
          <div ref={counterRef} className="mb-16">
            <h2 className="text-6xl md:text-8xl font-bold mb-4">
              {counter.toLocaleString()}+
            </h2>
            <p className="text-xl text-orange-500">Students connected through Clunite (and counting)</p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Discover events across 200+ colleges instantly", icon: Target },
              { title: "Smart recommendations match your interests", icon: Star },
              { title: "Form teams and connect with like-minded students", icon: Users },
              { title: "Track achievements and build your portfolio", icon: Trophy },
            ].map((item, index) => (
              <div key={index} className="border border-gray-700 p-6 rounded-lg hover:border-orange-500 transition-all duration-300 cursor-pointer group">
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-base leading-relaxed">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-6 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-600 mb-8">Trusted by students from India's top institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {[
              "IIT Delhi",
              "IIT Bombay",
              "BITS Pilani",
              "NIT Trichy",
              "VIT Vellore",
              "IIIT Hyderabad",
              "DTU",
              "NSUT",
            ].map((college, index) => (
              <div key={index} className="text-lg font-bold text-gray-900 hover:text-orange-500 transition-colors cursor-pointer">
                {college}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section with Tabs */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-sm font-bold tracking-wider text-orange-500 uppercase mb-6 block">Real campus teams, real results</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Built for every campus role
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl">
              Whether you're a student, organizer, or club leader—Clunite has the tools you need.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { id: "students", label: "Students" },
              { id: "organizers", label: "Event Organizers" },
              { id: "clubs", label: "Club Leaders" },
              { id: "colleges", label: "Colleges" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200">
            {activeTab === "students" && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Discover events that match your interests
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Smart recommendations help you find hackathons, workshops, cultural events, and competitions across 200+ colleges—automatically filtered to your skills and interests.
                  </p>
                  <Link href="/signup">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      Start discovering events →
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Member Management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Event Scheduling</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold">Engagement Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "organizers" && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Host events that students love
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    From registration to post-event feedback—manage everything in one place. Reach thousands of students across multiple campuses instantly.
                  </p>
                  <Link href="/dashboard/organizer/host/verify">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      Start hosting events →
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                      <span className="font-semibold">Real-time Analytics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold">Attendee Management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-rose-600" />
                      <span className="font-semibold">Verified Listings</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "clubs" && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Grow your club community
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Manage members, organize events, and track engagement—all in one dashboard. Build a thriving club culture with data-driven insights.
                  </p>
                  <Link href="/signup">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      Start building community →
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Member Management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Event Scheduling</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold">Engagement Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "colleges" && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Centralize campus activities
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Give your entire campus a unified platform for events, clubs, and student engagement. Monitor activity, ensure quality, and boost participation.
                  </p>
                  <Link href="/signup">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      Partner with us →
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-cyan-600" />
                      <span className="font-semibold">Multi-Campus Network</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-rose-600" />
                      <span className="font-semibold">Quality Control</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                      <span className="font-semibold">Campus-wide Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section - Zapier Style with Hero */}
      <section id="features" className="py-24 px-6 bg-[#FBF7F4]">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left Content */}
            <div>
              <span className="text-sm font-bold tracking-wider text-orange-500 uppercase mb-4 block">Platform Features</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Campus events,<br />
                all in one place
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Clunite brings events, clubs, teams, and opportunities into one place, so you can focus on building connections and growing your campus experience—all without switching platforms.
              </p>
            </div>

            {/* Right Illustration */}
            <div className="relative h-96 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0">
                {/* Grid lines */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="border border-gray-200"></div>
                ))}
              </div>
              {/* Decorative elements */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-500 rounded-full opacity-90"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-500 rounded opacity-90"></div>
              <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-orange-400 rotate-45"></div>
              {/* Curved arrow */}
              <svg className="absolute top-1/3 right-1/4 w-32 h-32 text-orange-500" viewBox="0 0 100 100" fill="none">
                <path d="M20 80 Q 50 20, 80 60" stroke="currentColor" strokeWidth="3" fill="none" />
                <polygon points="80,60 75,55 85,58" fill="currentColor" />
              </svg>
              {/* Person silhouette */}
              <div className="absolute bottom-8 left-8 w-12 h-16 bg-gray-900 rounded-t-full"></div>
              <div className="absolute bottom-8 right-12 w-8 h-12 bg-gray-700 rounded-t-full"></div>
            </div>
          </div>

          {/* 2x2 Feature Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Smart event discovery with personalized recommendations",
                description: "Find hackathons, workshops, and competitions that match your interests and skill level across 200+ colleges.",
                link: "Explore events"
              },
              {
                icon: Users,
                title: "Team formation and networking tools",
                description: "Connect with like-minded students and form teams for competitions, projects, and collaborative events.",
                link: "Build teams"
              },
              {
                icon: Trophy,
                title: "Achievement tracking and portfolio building",
                description: "Earn certificates, badges, and build your portfolio with every event you participate in.",
                link: "Track progress"
              },
              {
                icon: Globe,
                title: "Multi-campus network for inter-college events",
                description: "Connect with students from 200+ colleges across India and participate in inter-college competitions.",
                link: "Join network"
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-10 rounded-xl border border-gray-200 hover:border-orange-500 transition-all duration-300 group"
              >
                <div className="mb-6 p-3 bg-orange-50 rounded-lg inline-block">
                  <feature.icon className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <a href="#" className="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-orange-500 transition-colors group-hover:text-orange-500">
                  {feature.link} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Zapier Style */}
      <section id="pricing" className="py-24 px-6 bg-[#FBF7F4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-wider text-orange-500 uppercase mb-4 block">Flexible Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white p-8 rounded-xl border transition-all ${
                  plan.popular ? "border-orange-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <div className="inline-block bg-orange-500 text-white px-3 py-1 rounded-md text-xs font-semibold mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600 text-sm ml-1">{plan.period}</span>}
                </div>
                <p className="text-gray-600 mb-6 text-sm">{plan.description}</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mb-6 rounded-lg ${
                    plan.popular
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  } font-semibold py-2.5 text-sm h-11`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section - Zapier Style with Large Quote */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-sm font-bold tracking-wider text-orange-500 uppercase mb-4 block">Student Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Loved by students<br />across India
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl">
              See how students are using Clunite to discover events, build teams, and grow their campus experience.
            </p>
          </div>

          {/* Featured Large Testimonial */}
          <div className="mb-10 bg-gray-50 p-10 rounded-xl border border-gray-200">
            <div className="max-w-4xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-xl md:text-2xl font-medium text-gray-900 mb-6 leading-relaxed">
                "Clunite completely transformed how I discover and participate in campus events. I've connected with amazing people and built skills I never thought possible."
              </p>
              <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
                <div>
                  <div className="font-bold text-gray-900">Priya Sharma</div>
                  <div className="text-gray-600 text-sm">Computer Science Student</div>
                  <div className="text-orange-500 font-medium text-sm">IIT Delhi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of smaller testimonials */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(1).map((testimonial, index) => (
              <div
                key={index}
                className="group relative bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-orange-500 transition-all duration-300"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed text-sm">"{testimonial.content}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-bold text-gray-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-orange-500 font-medium">{testimonial.college}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Clean Accordion Style */}
      <section id="faq" className="py-24 px-6 bg-[#FBF7F4]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              FAQs
            </h2>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8">
            <Accordion type="single" collapsible className="space-y-1">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-gray-200 last:border-0"
                >
                  <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-5 text-base [&[data-state=open]]:text-orange-500">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 pb-5 leading-relaxed text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Can't find the answer you're looking for?{" "}
              <a href="#contact" className="text-orange-500 hover:text-orange-600 font-semibold underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Zapier Style with Background */}
      <section className="relative py-24 px-6 bg-gray-900 text-white overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 border border-orange-500/20 rounded-lg rotate-12"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-orange-500/10 rounded-full"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Ready to transform your<br />
            <span className="text-orange-500">campus experience?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of students who are already discovering amazing opportunities on Clunite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 text-lg font-semibold rounded-md transition-all hover:shadow-2xl hover:scale-105"
              >
                Start automating today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Zapier Style */}
      <footer className="bg-white border-t border-gray-200 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Clunite</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Connecting students with opportunities across India's top colleges.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-base mb-4">Platform</h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Browse Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Host Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Join Clubs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-base mb-4">Resources</h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-base mb-4">Contact</h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="mailto:hello@clunite.com" className="hover:text-gray-900 transition-colors">
                    hello@clunite.com
                  </a>
                </li>
                <li>
                  <a href="tel:+911234567890" className="hover:text-gray-900 transition-colors">
                    +91 12345 67890
                  </a>
                </li>
                <li>
                  <span>Bangalore, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 mb-4 md:mb-0">© 2024 Clunite. All rights reserved.</div>
            <div className="flex space-x-6 text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
