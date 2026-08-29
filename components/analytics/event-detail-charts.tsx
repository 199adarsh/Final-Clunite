"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface EventAnalyticsChartsProps {
  dailyRegistrations: Array<{ date: string; registrations: number }>
  demographicData: Array<{ name: string; value: number; color: string }>
}

export function EventAnalyticsCharts({ dailyRegistrations, demographicData }: EventAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Registrations</CardTitle>
          <CardDescription>Registration trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyRegistrations}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(date) => {
                  return new Date(date).toLocaleDateString();
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorRegistrations)"
                name="Registrations"
              />
              <Legend verticalAlign="top" height={36} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participant Demographics</CardTitle>
          <CardDescription>Registration by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={demographicData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={(props: any) => `${props.name} (${(props.percent * 100).toFixed(0)}%)`}
              >
                {demographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} participants`]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              />
              <Legend 
                formatter={(value: any, entry: any) => {
                  return <span style={{ color: entry.color }}>{value}</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {demographicData.length === 1 && demographicData[0].name === "No Data" && (
            <div className="flex items-center justify-center h-12 text-muted-foreground">
              No demographic data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EventAnalyticsCharts

