"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Calendar, Download, Target, Award, DollarSign, UserCheck, Activity, Brain, Sparkles, TrendingDown, AlertTriangle, LineChart } from "lucide-react"
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter } from "recharts"
import { predictFutureValues, analyzeTrend, detectAnomaly, calculateCorrelation, generateExtendedForecast, optimizeFunnel, type TimeSeriesData } from "@/lib/ml-analytics"

export default function EventAnalyticsPage() {
  const selectedEvent = {
    title: "AI & Machine Learning Workshop",
    date: "Nov 20, 2024",
    status: "completed",
  }

  const analyticsData = {
    views: 2450,
    registrations: 234,
    attendance: 198,
    certificates: 185,
    revenue: 11700,
    conversionRate: 9.6,
    attendanceRate: 84.6,
    certificateRate: 93.4,
  }

  const timelineData = [
    { date: "Nov 1", registrations: 15, views: 145, revenue: 750, attendance: 0 },
    { date: "Nov 5", registrations: 45, views: 420, revenue: 2250, attendance: 0 },
    { date: "Nov 10", registrations: 98, views: 890, revenue: 4900, attendance: 0 },
    { date: "Nov 15", registrations: 156, views: 1580, revenue: 7800, attendance: 0 },
    { date: "Nov 20", registrations: 234, views: 2450, revenue: 11700, attendance: 198 },
  ]

  // ML-powered predictions
  const historicalRegistrations: TimeSeriesData[] = timelineData.map(d => ({
    date: d.date,
    value: d.registrations
  }))

  const historicalViews: TimeSeriesData[] = timelineData.map(d => ({
    date: d.date,
    value: d.views
  }))

  const historicalRevenue: TimeSeriesData[] = timelineData.map(d => ({
    date: d.date,
    value: d.revenue
  }))

  // Generate predictions
  const registrationPredictions = generateExtendedForecast(historicalRegistrations, 5)
  const viewPredictions = generateExtendedForecast(historicalViews, 5)
  const revenuePredictions = generateExtendedForecast(historicalRevenue, 5)

  // Trend analysis
  const registrationTrend = analyzeTrend(historicalRegistrations)
  const viewTrend = analyzeTrend(historicalViews)
  const revenueTrend = analyzeTrend(historicalRevenue)

  // Anomaly detection
  const recentRegistrations = timelineData.map(d => d.registrations)
  const registrationAnomaly = detectAnomaly(234, recentRegistrations.slice(0, -1))

  // Correlation analysis
  const viewsRegistrationsCorr = calculateCorrelation(
    timelineData.map(d => d.views),
    timelineData.map(d => d.registrations)
  )

  // Combined data for visualization
  const combinedTimelineData = [
    ...timelineData.map(d => ({ ...d, type: 'actual' })),
    ...registrationPredictions.map((pred, idx) => ({
      date: pred.date,
      registrations: pred.predicted,
      views: viewPredictions[idx].predicted,
      revenue: revenuePredictions[idx].predicted,
      attendance: 0,
      type: 'predicted',
      confidenceLower: pred.confidence.lower,
      confidenceUpper: pred.confidence.upper
    }))
  ]

  // Funnel optimization
  const funnelOptimization = optimizeFunnel([
    { stage: 'views_to_registrations', count: analyticsData.views, rate: analyticsData.conversionRate },
    { stage: 'registrations_to_attendance', count: analyticsData.registrations, rate: analyticsData.attendanceRate },
    { stage: 'attendance_to_certificates', count: analyticsData.attendance, rate: analyticsData.certificateRate }
  ])

  const participantStats = {
    byCollege: [
      { name: "IIT Delhi", count: 45, percentage: 19.2 },
      { name: "BITS Pilani", count: 38, percentage: 16.2 },
      { name: "NIT Trichy", count: 32, percentage: 13.7 },
      { name: "Delhi University", count: 28, percentage: 12.0 },
      { name: "Others", count: 91, percentage: 38.9 },
    ],
    byDepartment: [
      { name: "Computer Science", count: 89, percentage: 38.0 },
      { name: "Engineering", count: 56, percentage: 23.9 },
      { name: "Mathematics", count: 34, percentage: 14.5 },
      { name: "Business", count: 28, percentage: 12.0 },
      { name: "Others", count: 27, percentage: 11.5 },
    ],
    byYear: [
      { name: "1st Year", count: 42, percentage: 17.9 },
      { name: "2nd Year", count: 78, percentage: 33.3 },
      { name: "3rd Year", count: 67, percentage: 28.6 },
      { name: "4th Year", count: 47, percentage: 20.1 },
    ],
  }

  const performanceMetrics = [
    {
      title: "Registration Conversion",
      value: "9.6%",
      change: "+1.2%",
      changeType: "positive",
      description: "Views to registrations",
      icon: Target,
      color: "blue",
    },
    {
      title: "Attendance Rate",
      value: "84.6%",
      change: "+3.1%",
      changeType: "positive",
      description: "Registrations to attendance",
      icon: UserCheck,
      color: "green",
    },
    {
      title: "Certificate Completion",
      value: "93.4%",
      change: "+5.2%",
      changeType: "positive",
      description: "Attendance to certificates",
      icon: Award,
      color: "orange",
    },
    {
      title: "Revenue per Participant",
      value: "₹50",
      change: "+₹5",
      changeType: "positive",
      description: "Average revenue generated",
      icon: DollarSign,
      color: "slate",
    },
  ]

  const getMetricColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-50"
      case "green":
        return "text-green-600 bg-green-50"
      case "orange":
        return "text-orange-600 bg-orange-50"
      case "slate":
        return "text-slate-600 bg-slate-50"
      default:
        return "text-slate-600 bg-slate-50"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Event Analytics</h1>
              <p className="text-lg text-slate-600 font-medium">Comprehensive insights and performance metrics</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Event Selector */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedEvent.title}</h3>
                  <p className="text-slate-600 font-medium">{selectedEvent.date}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 font-semibold">
                  {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                </Badge>
              </div>
              <Button
                variant="outline"
                className="border-slate-300 hover:border-blue-500 hover:text-blue-600 font-semibold bg-transparent"
              >
                Change Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Metrics */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Key Performance Indicators</h2>
              <p className="text-slate-600">Real-time metrics and event performance</p>
            </div>
            <Select defaultValue="30d">
              <SelectTrigger className="w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <Card 
                key={index} 
                className="border-slate-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${getMetricColor(metric.color)} shadow-sm`}>
                      <metric.icon className="h-6 w-6" />
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs font-semibold">
                      {metric.change}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{metric.title}</p>
                    <p className="text-3xl font-black text-slate-900">{metric.value}</p>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-600 font-medium">Trending upward</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="participants" className="font-semibold">
              Participants
            </TabsTrigger>
            <TabsTrigger value="timeline" className="font-semibold">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="revenue" className="font-semibold">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="ml-insights" className="font-semibold">
              <Brain className="h-4 w-4 mr-2 inline" />
              ML Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Conversion Funnel</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Track how users moved through your event funnel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Event Views</span>
                      <span className="text-sm font-bold text-slate-900">{analyticsData.views.toLocaleString()}</span>
                    </div>
                    <Progress value={100} className="h-3 bg-slate-100" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Registrations</span>
                      <span className="text-sm font-bold text-slate-900">{analyticsData.registrations}</span>
                    </div>
                    <Progress value={analyticsData.conversionRate} className="h-3 bg-slate-100" />
                    <p className="text-xs text-slate-500 font-medium">
                      {analyticsData.conversionRate}% conversion rate
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Attendance</span>
                      <span className="text-sm font-bold text-slate-900">{analyticsData.attendance}</span>
                    </div>
                    <Progress value={analyticsData.attendanceRate} className="h-3 bg-slate-100" />
                    <p className="text-xs text-slate-500 font-medium">
                      {analyticsData.attendanceRate}% attendance rate
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Certificates</span>
                      <span className="text-sm font-bold text-slate-900">{analyticsData.certificates}</span>
                    </div>
                    <Progress value={analyticsData.certificateRate} className="h-3 bg-slate-100" />
                    <p className="text-xs text-slate-500 font-medium">
                      {analyticsData.certificateRate}% completion rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Performance Insights</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Key takeaways and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-bold text-green-800">Excellent Attendance</span>
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      Your {analyticsData.attendanceRate}% attendance rate is 12% above industry average
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-bold text-blue-800">High Engagement</span>
                    </div>
                    <p className="text-sm text-blue-700 font-medium">
                      {analyticsData.certificateRate}% certificate completion shows strong participant engagement
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center mb-2">
                      <Target className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-bold text-orange-800">Growth Opportunity</span>
                    </div>
                    <p className="text-sm text-orange-700 font-medium">
                      Consider A/B testing event descriptions to improve conversion rate
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-5 w-5 text-slate-600 mr-2" />
                      <span className="font-bold text-slate-800">Revenue Performance</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">
                      Generated ₹{analyticsData.revenue.toLocaleString()} with strong ROI metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* By College */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">By College</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Participant distribution across institutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {participantStats.byCollege.map((college, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{college.name}</span>
                        <span className="text-sm font-bold text-slate-900">{college.count}</span>
                      </div>
                      <Progress value={college.percentage} className="h-2 bg-slate-100" />
                      <p className="text-xs text-slate-500 font-medium">{college.percentage}% of total</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* By Department */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">By Department</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Academic department breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {participantStats.byDepartment.map((dept, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{dept.name}</span>
                        <span className="text-sm font-bold text-slate-900">{dept.count}</span>
                      </div>
                      <Progress value={dept.percentage} className="h-2 bg-slate-100" />
                      <p className="text-xs text-slate-500 font-medium">{dept.percentage}% of total</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* By Year */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">By Academic Year</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">Year of study distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {participantStats.byYear.map((year, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{year.name}</span>
                        <span className="text-sm font-bold text-slate-900">{year.count}</span>
                      </div>
                      <Progress value={year.percentage} className="h-2 bg-slate-100" />
                      <p className="text-xs text-slate-500 font-medium">{year.percentage}% of total</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="grid gap-6">
              {/* Registration Growth with Predictions */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    Registration Growth & ML Predictions
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Historical data with AI-powered forecasting and confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={combinedTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontWeight: 600
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        fill="#dbeafe"
                        stroke="none"
                        fillOpacity={0.3}
                        name="Confidence Range"
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceLower"
                        fill="#fff"
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="registrations"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        name="Registrations"
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#10b981', r: 4 }}
                        name="Views"
                      />
                      <ReferenceLine 
                        x="Nov 20" 
                        stroke="#ef4444" 
                        strokeDasharray="3 3"
                        label={{ value: 'Event Date', position: 'top', fill: '#ef4444', fontWeight: 600 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-bold text-blue-800">Trend Analysis</span>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">
                        {registrationTrend.trend === 'upward' ? '📈' : registrationTrend.trend === 'downward' ? '📉' : '➡️'} 
                        {' '}{registrationTrend.trend.charAt(0).toUpperCase() + registrationTrend.trend.slice(1)} trend
                        {' '}({Math.abs(registrationTrend.changeRate).toFixed(1)}% change rate)
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-bold text-green-800">Next Period Forecast</span>
                      </div>
                      <p className="text-sm text-green-700 font-medium">
                        Expected: {registrationTrend.forecast} registrations
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center mb-2">
                        <LineChart className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="font-bold text-orange-800">Correlation</span>
                      </div>
                      <p className="text-sm text-orange-700 font-medium">
                        Views ↔ Registrations: {(viewsRegistrationsCorr * 100).toFixed(1)}% correlation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Trends */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Revenue Trends & Forecasting</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Revenue growth analysis with predictive modeling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={combinedTimelineData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontWeight: 600
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-orange-800 mb-1">Revenue Growth Rate</p>
                        <p className="text-2xl font-black text-orange-900">
                          {revenueTrend.changeRate > 0 ? '+' : ''}{revenueTrend.changeRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-800 mb-1">Projected Next Period</p>
                        <p className="text-2xl font-black text-orange-900">
                          ₹{revenueTrend.forecast.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Revenue Breakdown</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Detailed financial performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <span className="font-semibold text-green-800">Total Revenue</span>
                      <span className="text-2xl font-black text-green-900">
                        ₹{analyticsData.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <span className="font-semibold text-blue-800">Revenue per Registration</span>
                      <span className="text-xl font-bold text-blue-900">₹50</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                      <span className="font-semibold text-orange-800">Platform Fee (5%)</span>
                      <span className="text-lg font-bold text-orange-900">
                        ₹{(analyticsData.revenue * 0.05).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="font-semibold text-slate-800">Net Revenue</span>
                      <span className="text-xl font-bold text-slate-900">
                        ₹{(analyticsData.revenue * 0.95).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Financial Insights</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Revenue optimization recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-bold text-green-800">Strong Performance</span>
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      Revenue exceeded target by 23% with excellent conversion rates
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-2">
                      <Target className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-bold text-blue-800">Optimization Tip</span>
                    </div>
                    <p className="text-sm text-blue-700 font-medium">
                      Consider tiered pricing for early bird registrations to boost revenue
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center mb-2">
                      <Activity className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-bold text-orange-800">Growth Potential</span>
                    </div>
                    <p className="text-sm text-orange-700 font-medium">
                      Similar events show 40% higher revenue with premium add-ons
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ml-insights" className="space-y-6">
            <div className="grid gap-6">
              {/* ML Overview */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-purple-50 shadow-sm">
                        <Brain className="h-6 w-6 text-purple-600" />
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-2 py-1 text-xs font-semibold">
                        AI-Powered
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Prediction Accuracy</p>
                    <p className="text-3xl font-black text-slate-900 mb-2">
                      {(registrationTrend.strength * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Model confidence score</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-blue-50 shadow-sm">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge className={`${registrationAnomaly.isAnomaly ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'} px-2 py-1 text-xs font-semibold`}>
                        {registrationAnomaly.isAnomaly ? 'Anomaly' : 'Normal'}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Anomaly Score</p>
                    <p className="text-3xl font-black text-slate-900 mb-2">
                      {registrationAnomaly.score.toFixed(2)}σ
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Standard deviations from mean</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-green-50 shadow-sm">
                        <LineChart className="h-6 w-6 text-green-600" />
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs font-semibold">
                        Strong
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Views-Registration Correlation</p>
                    <p className="text-3xl font-black text-slate-900 mb-2">
                      {(viewsRegistrationsCorr * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Pearson correlation coefficient</p>
                  </CardContent>
                </Card>
              </div>

              {/* Anomaly Detection */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Anomaly Detection & Pattern Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Statistical analysis to identify unusual patterns and outliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {registrationAnomaly.isAnomaly ? (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                          <span className="font-bold text-red-800">Anomaly Detected</span>
                        </div>
                        <p className="text-sm text-red-700 font-medium mb-3">
                          Current registration count ({analyticsData.registrations}) is significantly outside the expected range.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-red-600 font-semibold mb-1">Expected Range</p>
                            <p className="text-lg font-bold text-red-900">
                              {registrationAnomaly.expectedRange.min} - {registrationAnomaly.expectedRange.max}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-red-600 font-semibold mb-1">Actual Value</p>
                            <p className="text-lg font-bold text-red-900">{analyticsData.registrations}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-bold text-green-800">Normal Pattern</span>
                        </div>
                        <p className="text-sm text-green-700 font-medium mb-3">
                          Registration patterns are within expected statistical bounds.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-green-600 font-semibold mb-1">Expected Range</p>
                            <p className="text-lg font-bold text-green-900">
                              {registrationAnomaly.expectedRange.min} - {registrationAnomaly.expectedRange.max}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-green-600 font-semibold mb-1">Actual Value</p>
                            <p className="text-lg font-bold text-green-900">{analyticsData.registrations}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsBarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b"
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontWeight: 600
                          }}
                        />
                        <Bar dataKey="registrations" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <ReferenceLine 
                          y={registrationAnomaly.expectedRange.max} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3"
                          label={{ value: 'Upper Bound', position: 'right', fill: '#ef4444', fontSize: 11, fontWeight: 600 }}
                        />
                        <ReferenceLine 
                          y={registrationAnomaly.expectedRange.min} 
                          stroke="#10b981" 
                          strokeDasharray="3 3"
                          label={{ value: 'Lower Bound', position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 600 }}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Funnel Optimization */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    ML-Powered Funnel Optimization
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    AI recommendations to improve conversion at each stage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {funnelOptimization.map((stage, index) => {
                      const stageNames: Record<string, string> = {
                        'views_to_registrations': 'Views → Registrations',
                        'registrations_to_attendance': 'Registrations → Attendance',
                        'attendance_to_certificates': 'Attendance → Certificates'
                      }
                      const gap = stage.potentialRate - stage.currentRate
                      const isOptimal = gap <= 1

                      return (
                        <div key={index} className={`p-4 rounded-xl border ${isOptimal ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-slate-900 mb-1">{stageNames[stage.stage]}</p>
                              <p className="text-xs text-slate-600 font-medium">
                                Current: {stage.currentRate.toFixed(1)}% | Benchmark: {stage.potentialRate.toFixed(1)}%
                              </p>
                            </div>
                            {isOptimal ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                ✓ Optimal
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                ⚠ Improve
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-slate-700">Current Performance</span>
                              <span className="font-bold text-slate-900">{stage.currentRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={stage.currentRate} className="h-2 bg-slate-100" />
                            {!isOptimal && (
                              <>
                                <div className="flex items-center justify-between text-sm mt-3">
                                  <span className="font-semibold text-orange-700">Potential with Optimization</span>
                                  <span className="font-bold text-orange-900">{stage.potentialRate.toFixed(1)}%</span>
                                </div>
                                <Progress value={stage.potentialRate} className="h-2 bg-orange-100" />
                                <div className="mt-3 p-3 bg-white rounded-lg">
                                  <p className="text-xs font-semibold text-orange-800 mb-1">Potential Impact</p>
                                  <p className="text-sm text-orange-700 font-medium">
                                    +{stage.impact} additional conversions at this stage
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Insights */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                      Predictive Insights
                    </CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                      ML-generated forecasts and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center mb-2">
                        <Brain className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-bold text-purple-800">Next Event Forecast</span>
                      </div>
                      <p className="text-sm text-purple-700 font-medium mb-3">
                        Based on historical patterns and trend analysis:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-purple-600 font-semibold mb-1">Expected Registrations</p>
                          <p className="text-2xl font-black text-purple-900">{registrationTrend.forecast}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-purple-600 font-semibold mb-1">Expected Revenue</p>
                          <p className="text-2xl font-black text-purple-900">₹{revenueTrend.forecast.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-bold text-blue-800">Growth Trajectory</span>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">
                        {registrationTrend.trend === 'upward' 
                          ? `Strong upward momentum with ${Math.abs(registrationTrend.changeRate).toFixed(1)}% growth rate. Continue current strategies.`
                          : registrationTrend.trend === 'downward'
                          ? `Declining trend detected. Consider revising marketing approach and event format.`
                          : `Stable performance. Experiment with new strategies to drive growth.`
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center mb-2">
                        <Award className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-bold text-green-800">Confidence Level</span>
                      </div>
                      <p className="text-sm text-green-700 font-medium mb-2">
                        Model confidence: {(registrationTrend.strength * 100).toFixed(0)}%
                      </p>
                      <Progress value={registrationTrend.strength * 100} className="h-2 bg-green-100" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-orange-600" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                      Data-driven suggestions to maximize performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-start mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-bold text-blue-900 mb-1">Optimize Registration Flow</p>
                          <p className="text-sm text-blue-700 font-medium">
                            Your conversion rate is {analyticsData.conversionRate.toFixed(1)}%. Industry benchmark is 12%. 
                            Simplify the registration form to reduce friction.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-start mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-bold text-green-900 mb-1">Leverage High Correlation</p>
                          <p className="text-sm text-green-700 font-medium">
                            Strong {(viewsRegistrationsCorr * 100).toFixed(0)}% correlation between views and registrations. 
                            Invest in increasing event visibility through targeted marketing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <div className="flex items-start mb-2">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-bold text-orange-900 mb-1">Capitalize on Momentum</p>
                          <p className="text-sm text-orange-700 font-medium">
                            {registrationTrend.trend === 'upward' 
                              ? 'Positive trend detected. Launch similar events to maintain momentum.'
                              : 'Consider A/B testing different event formats and pricing strategies.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-start mb-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white font-bold text-sm">4</span>
                        </div>
                        <div>
                          <p className="font-bold text-purple-900 mb-1">Improve Certificate Completion</p>
                          <p className="text-sm text-purple-700 font-medium">
                            Excellent {analyticsData.certificateRate.toFixed(1)}% completion rate! 
                            Use certificates as social proof in marketing materials.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
