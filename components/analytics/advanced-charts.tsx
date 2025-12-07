"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Flame, Zap, Target } from "lucide-react"
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
  ComposedChart,
  Cell,
  ReferenceLine,
  Brush,
  Legend,
} from "recharts"

// Advanced Tooltip with Metrics
const AdvancedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-2xl border-2 border-orange-200 rounded-2xl p-5 shadow-2xl">
        <p className="font-bold text-gray-900 mb-3 text-lg">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">{entry.value}</span>
          </div>
        ))}
        {payload[0]?.payload?.trend && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Trend: </span>
              <span className="font-semibold text-green-600">
                +{payload[0].payload.trend}%
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

// Heatmap-style Engagement Chart
export function HeatmapEngagementChart({ data }: { data: any[] }) {
  const getColor = (value: number) => {
    if (value >= 80) return "#10b981" // green
    if (value >= 60) return "#f59e0b" // orange
    if (value >= 40) return "#f97316" // dark orange
    return "#ef4444" // red
  }

  return (
    <Card className="border-none shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl shadow-xl">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Engagement Heatmap</CardTitle>
            <CardDescription className="text-base">Daily engagement intensity over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              style={{ fontSize: "13px", fontWeight: 600 }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "13px", fontWeight: 600 }} />
            <Tooltip content={<AdvancedTooltip />} />
            <Bar dataKey="engagement" radius={[8, 8, 0, 0]} animationDuration={1800}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.engagement)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Low (0-40)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-600">Medium (40-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">Good (60-80)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Excellent (80+)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Multi-line Comparison Chart with Brush
export function MultiMetricComparisonChart({ data }: { data: any[] }) {
  return (
    <Card className="border-none shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Multi-Metric Analysis</CardTitle>
            <CardDescription className="text-base">Compare multiple KPIs over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: "13px", fontWeight: 600 }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "13px", fontWeight: 600 }} />
            <Tooltip content={<AdvancedTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "30px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 8 }}
              animationDuration={2000}
            />
            <Line
              type="monotone"
              dataKey="participants"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", r: 5 }}
              activeDot={{ r: 8 }}
              animationDuration={2000}
            />
            <Line
              type="monotone"
              dataKey="satisfaction"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ fill: "#ec4899", r: 5 }}
              activeDot={{ r: 8 }}
              animationDuration={2000}
            />
            <Brush
              dataKey="month"
              height={30}
              stroke="#f97316"
              fill="#fff7ed"
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Stacked Area Chart with Goals
export function GoalProgressChart({ data }: { data: any[] }) {
  return (
    <Card className="border-none shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-green-50 via-white to-teal-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl shadow-xl">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Goal Progress</CardTitle>
              <CardDescription className="text-base">Track progress towards targets</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-700">On Track</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: "13px", fontWeight: 600 }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "13px", fontWeight: 600 }} />
            <Tooltip content={<AdvancedTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            />
            <ReferenceLine
              y={100}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Goal",
                position: "right",
                fill: "#f97316",
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              fill="url(#actualGradient)"
              stroke="#10b981"
              strokeWidth={3}
              animationDuration={2000}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={2000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
