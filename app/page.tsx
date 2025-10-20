"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Team Formation",
      description: "Connect with like-minded students and form teams for competitions and projects.",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Trophy,
      title: "Achievement Tracking",
      description: "Earn certificates, badges, and build your portfolio with every event you participate in.",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your progress, see your growth, and get insights into your learning journey.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Shield,
      title: "Verified Events",
      description: "All events are verified by our team to ensure quality and authenticity.",
      color: "from-red-500 to-red-600",
    },
    {
      icon: Globe,
      title: "Multi-Campus Network",
      description: "Connect with students from 200+ colleges across India and participate in inter-college events.",
      color: "from-indigo-500 to-indigo-600",
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
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Modern Header with Clunite Branding */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          isScrolled ? "bg-white/70 backdrop-blur-2xl shadow-2xl shadow-slate-900/10" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6">
          <div
            className={`flex items-center justify-between h-20 transition-all duration-700 ease-out transform ${
              isScrolled
                ? "bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-900/10 px-8 my-4 scale-[0.98] hover:scale-100"
                : "scale-100"
            }`}
          >
            {/* Clunite Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-white font-black text-lg group-hover:scale-110 transition-transform duration-300">
                    C
                  </span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition-all duration-500"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-all duration-300">
                  Clunite
                </span>
                <div className="text-xs text-slate-500 font-bold tracking-wide group-hover:text-purple-500 transition-colors duration-300">
                  UNITE • CREATE • CELEBRATE
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="relative px-6 py-3 text-slate-600 hover:text-indigo-600 font-semibold transition-all duration-300 rounded-2xl group overflow-hidden"
                >
                  <span className="relative z-10 transition-all duration-300">{item.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                  <span className="relative z-10 flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative w-12 h-12 rounded-2xl hover:bg-slate-100 transition-all duration-300 group"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute block w-6 h-0.5 bg-slate-700 transition-all duration-500 ease-out ${
                    isMobileMenuOpen ? "rotate-45 top-3 bg-indigo-600" : "top-1"
                  }`}
                ></span>
                <span
                  className={`absolute block w-6 h-0.5 bg-slate-700 top-3 transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                  }`}
                ></span>
                <span
                  className={`absolute block w-6 h-0.5 bg-slate-700 transition-all duration-500 ease-out ${
                    isMobileMenuOpen ? "-rotate-45 top-3 bg-indigo-600" : "top-5"
                  }`}
                ></span>
              </div>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-700 ease-out ${
              isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="py-6 space-y-2 bg-white/95 backdrop-blur-2xl rounded-3xl mt-4 border border-slate-200/60 shadow-2xl mx-4 transform transition-all duration-500">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between px-6 py-4 text-slate-700 hover:text-indigo-600 font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 mx-2 rounded-2xl group"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="transition-all duration-300">{item.name}</span>
                  <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </a>
              ))}
              <div className="px-4 pt-4 space-y-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full py-4 rounded-2xl font-semibold border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 bg-transparent hover:scale-105"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 via-purple-100/10 to-pink-100/10 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>

        <div className="container mx-auto text-center max-w-7xl relative z-10">
          {/* Animated Badge */}
          <div className="animate-fade-in-up">
            <Badge className="mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-700 border-indigo-200 px-8 py-4 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              🚀 Trusted by 50,000+ Students • 200+ Colleges • 10,000+ Events
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="animate-fade-in-up delay-200">
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight text-slate-900">
              Welcome to
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                Clunite
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className="animate-fade-in-up delay-400">
            <p className="text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              The most comprehensive platform for discovering events, building skills, and connecting with opportunities
              across India's top colleges. <strong>Unite • Create • Celebrate</strong> your campus journey.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-600 flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <Play className="mr-3 h-6 w-6" />
                Start Exploring
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/dashboard/organizer/host/verify">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 bg-white/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-1"
              >
                <Plus className="mr-3 h-5 w-5" />
                Host an Event
              </Button>
            </Link>
          </div>

          {/* Animated Stats */}
          <div className="animate-fade-in-up delay-800 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Users, value: "50K+", label: "Active Students", color: "text-indigo-600", delay: "delay-1000" },
              { icon: Calendar, value: "10K+", label: "Events Hosted", color: "text-purple-600", delay: "delay-1200" },
              { icon: Award, value: "200+", label: "Partner Colleges", color: "text-pink-600", delay: "delay-1400" },
              { icon: TrendingUp, value: "95%", label: "Success Rate", color: "text-slate-600", delay: "delay-1600" },
            ].map((stat, index) => (
              <div
                key={index}
                className={`text-center group hover:scale-110 transition-all duration-300 ${stat.delay}`}
              >
                <div
                  className={`w-20 h-20 ${stat.color} bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-slate-100 group-hover:border-slate-200`}
                >
                  <stat.icon className="h-10 w-10" />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-2 rounded-full font-semibold">
              ✨ Features
            </Badge>
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                succeed on campus
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover powerful features designed to enhance your college experience and connect you with opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-50 text-green-700 border-green-200 px-4 py-2 rounded-full font-semibold">
              💰 Pricing
            </Badge>
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Simple, transparent
              <br />
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                pricing for everyone
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-500 relative ${
                  plan.popular ? "ring-2 ring-indigo-500 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-slate-600">{plan.period}</span>}
                  </div>
                  <p className="text-slate-600">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                        : "border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 bg-transparent text-slate-700"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section id="testimonials" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-200 px-4 py-2 rounded-full font-semibold">
              🌟 Success Stories
            </Badge>
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Loved by students
              <br />
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                across India
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See how Clunite has transformed the campus experience for thousands of students and organizers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                      <div className="text-sm text-indigo-600 font-medium">{testimonial.college}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-purple-50/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-200 px-4 py-2 rounded-full font-semibold">
              ❓ FAQ
            </Badge>
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Frequently asked
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                questions
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about Clunite. Can't find the answer you're looking for?
              <a href="#contact" className="text-indigo-600 hover:text-indigo-800 font-semibold">
                {" "}
                Contact us
              </a>
              .
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-slate-200 rounded-2xl px-6 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-indigo-600 py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-6 leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-5xl font-black text-white mb-6">
            Ready to transform your
            <br />
            campus experience?
          </h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Join thousands of students who are already discovering amazing opportunities on Clunite.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-50 px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="mr-3 h-6 w-6" />
                Start Exploring
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 bg-transparent hover:scale-105"
              >
                <Plus className="mr-3 h-5 w-5" />
                Host an Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black">C</span>
                </div>
                <div>
                  <div className="text-xl font-black">Clunite</div>
                  <div className="text-xs text-slate-400 font-bold tracking-wide">UNITE • CREATE • CELEBRATE</div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Connecting students with opportunities across India's top colleges.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Platform</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Browse Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Host Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Join Clubs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href="mailto:hello@clunite.com" className="hover:text-white transition-colors">
                    hello@clunite.com
                  </a>
                </li>
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href="tel:+911234567890" className="hover:text-white transition-colors">
                    +91 12345 67890
                  </a>
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Bangalore, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 mb-4 md:mb-0">© 2024 Clunite. All rights reserved.</div>
            <div className="flex space-x-6 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1200 { animation-delay: 1.2s; }
        .delay-1400 { animation-delay: 1.4s; }
        .delay-1600 { animation-delay: 1.6s; }
      `}</style>
    </div>
  )
}
