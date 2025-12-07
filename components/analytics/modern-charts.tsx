"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Users, Target, Zap, BarChart3 } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Legend,
  Scatter,
  Cell,
  PieChart,
  Pie,
} from "recharts"

// Modern gradient definitions
const gradients = {
  orange: { start: "#FF6B35", end: "#F7931E" },
  purple: { start: "#667eea", end: "#764ba2" },
  blue: { start: "#4facfe", end: "#00f2fe" },
  green: { start: "#11998e", end: "#38ef7d" },
  pink: { start: "#f093fb", end: "#f5576c" },
  teal: { start: "#0ba360", end: "#3cba92" },
}

// Custom tooltip with glassmorphism effect
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl p-4 shadow-2xl">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-bold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Engagement Trends Chart with Gradient Area
export function EngagementTrendsChart({ data }: { data: any[] }) {
  // Ensure minimum data for visibility
  const chartData = data.length > 0 ? data : [
    { month: 'No Data', engagement: 0 }
  ]
  
  // Calculate max value for better scaling
  const maxValue = Math.max(...chartData.map(d => d.engagement || 0), 5)
  
  const hasData = data.length > 0 && data.some(d => d.engagement > 0)
  
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Engagement Trends</CardTitle>
            <CardDescription className="text-xs">Participant engagement over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No engagement data yet</p>
            <p className="text-xs text-gray-500">Data will appear as participants register</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F7931E" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                domain={[0, maxValue + 2]}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#FF6B35"
                strokeWidth={2.5}
                fill="url(#engagementGradient)"
                animationDuration={1500}
                dot={{ fill: '#FF6B35', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Multi-metric Performance Chart
export function PerformanceOverviewChart({ data }: { data: any[] }) {
  // Ensure minimum values for visibility
  const chartData = data.map(item => ({
    ...item,
    value: Math.max(item.value || 0, 5) // Minimum 5 for visibility
  }))
  
  const hasData = data.some(d => d.value > 0)
  
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg shadow-md">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Performance Overview</CardTitle>
            <CardDescription className="text-xs">Multi-dimensional performance analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No performance data yet</p>
            <p className="text-xs text-gray-500">Metrics will appear as you host events</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#11998e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#38ef7d" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#d1d5db" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#11998e"
                fill="url(#radarGradient)"
                fillOpacity={0.6}
                strokeWidth={2.5}
                animationDuration={1500}
                dot={{ fill: '#11998e', r: 4 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Monthly Trends with Dual Axis
export function MonthlyTrendsChart({ data }: { data: any[] }) {
  const hasData = data.length > 0 && data.some(d => d.participants > 0 || d.revenue > 0)
  
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Monthly Trends</CardTitle>
              <CardDescription className="text-xs">Participation and revenue over time</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No monthly data yet</p>
            <p className="text-xs text-gray-500">Trends will appear as you host events</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="participantsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4facfe" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "15px", fontSize: "11px", fontWeight: 600 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="participants"
                fill="url(#participantsGradient)"
                stroke="#4facfe"
                strokeWidth={2.5}
                animationDuration={1500}
                dot={{ fill: '#4facfe', r: 3 }}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="#11998e"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Event Categories Distribution with Modern Donut
export function EventCategoriesChart({ data }: { data: any[] }) {
  const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe"]
  
  const hasData = data.length > 0 && data.some(d => d.value > 0)

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Event Categories</CardTitle>
              <CardDescription className="text-xs">Distribution by category</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No category data yet</p>
            <p className="text-xs text-gray-500">Create events to see distribution</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1500}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                style={{ fontSize: '11px', fontWeight: 600 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Participants vs Satisfaction Scatter Plot
export function ParticipantsSatisfactionChart({ data }: { data: any[] }) {
  const hasData = data.length > 0 && data.some(d => d.participants > 0)
  
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-rose-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-md">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Participants vs Satisfaction</CardTitle>
            <CardDescription className="text-xs">Event size and satisfaction correlation</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="h-8 w-8 text-pink-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No satisfaction data yet</p>
            <p className="text-xs text-gray-500">Data will appear after events complete</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="participants"
                name="Participants"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                label={{ value: 'Participants', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis
                dataKey="satisfaction"
                name="Satisfaction"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                domain={[0, 5]}
                label={{ value: 'Rating', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name="Events"
                dataKey="satisfaction"
                fill="#f093fb"
                shape="circle"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(240, 147, 251, ${0.5 + (entry.satisfaction / 10) * 0.5})`}
                    r={6}
                  />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Event Type Analysis with Gradient Bars
export function EventTypeAnalysisChart({ data }: { data: any[] }) {
  const hasData = data.length > 0 && data.some(d => d.value > 0)
  
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-md">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Event Type Analysis</CardTitle>
            <CardDescription className="text-xs">Performance by event type</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No event type data yet</p>
            <p className="text-xs text-gray-500">Create different event types to see analysis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#f5576c" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#f093fb" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#6b7280" 
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="type"
                stroke="#6b7280"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[0, 6, 6, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
