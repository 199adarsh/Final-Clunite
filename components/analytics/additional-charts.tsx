"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, BarChart3, PieChart as PieChartIcon, Calendar } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts"

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

// Participants by Department Chart
export function ParticipantsByDepartmentChart({ data }: { data: any[] }) {
  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f97316", "#14b8a6"]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Participants by Department</CardTitle>
            <CardDescription>Distribution across academic departments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#9ca3af" style={{ fontSize: "12px", fontWeight: 500 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 500 }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Participants by Year Chart
export function ParticipantsByYearChart({ data }: { data: any[] }) {
  const COLORS = ["#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Participants by Academic Year</CardTitle>
            <CardDescription>Year-wise student distribution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Event Comparison Chart
export function EventComparisonChart({ data }: { data: any[] }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Event Performance Comparison</CardTitle>
            <CardDescription>Compare registrations and attendance across events</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="title"
              stroke="#9ca3af"
              style={{ fontSize: "11px", fontWeight: 500 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px", fontWeight: 500 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px", fontWeight: 600 }} />
            <Bar dataKey="registrations" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Registrations" />
            <Bar dataKey="attendance" fill="#ec4899" radius={[8, 8, 0, 0]} name="Attendance" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Registration by Category Chart
export function RegistrationByCategoryChart({ data }: { data: any[] }) {
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <PieChartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Registrations by Category</CardTitle>
            <CardDescription>Event category distribution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1500}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Income vs Expenses Chart
export function IncomeVsExpensesChart({ data }: { data: any }) {
  const chartData = [
    { name: "Total Income", value: data.totalIncome, fill: "#10b981" },
    { name: "Total Expenses", value: data.totalExpenses, fill: "#ef4444" },
    { name: "Net Profit", value: data.netProfit, fill: data.netProfit >= 0 ? "#3b82f6" : "#f59e0b" },
  ]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Income vs Expenses</CardTitle>
            <CardDescription>Financial performance overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 500 }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 500 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-semibold mb-1">Total Income</p>
            <p className="text-lg font-bold text-green-900">₹{data.totalIncome.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 font-semibold mb-1">Total Expenses</p>
            <p className="text-lg font-bold text-red-900">₹{data.totalExpenses.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-lg border ${data.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className={`text-xs font-semibold mb-1 ${data.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
            <p className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
              ₹{data.netProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Expense Breakdown Chart
export function ExpenseBreakdownChart({ data }: { data: any[] }) {
  const COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-red-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
            <PieChartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Expense Breakdown</CardTitle>
            <CardDescription>Detailed expense allocation</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Participants by Gender Chart
export function ParticipantsByGenderChart({ data }: { data: any[] }) {
  const COLORS = ["#3b82f6", "#ec4899", "#8b5cf6"]

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Participants by Gender</CardTitle>
            <CardDescription>Gender distribution analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={5}
              dataKey="count"
              animationDuration={1500}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Engagement Trends Over Time
export function EngagementTrendsOverTimeChart({ data }: { data: any[] }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Engagement Trends Over Time</CardTitle>
            <CardDescription>Registration and attendance patterns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="registrationsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 500 }}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px", fontWeight: 500 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px", fontWeight: 600 }} />
            <Area
              type="monotone"
              dataKey="registrations"
              fill="url(#registrationsGradient)"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Registrations"
              animationDuration={2000}
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ fill: "#ec4899", r: 4 }}
              name="Attendance"
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
