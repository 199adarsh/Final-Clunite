// ML Analytics Tab Content Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  LineChart,
  Award,
  Activity,
  Zap,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts"

interface MLAnalyticsProps {
  events: any[]
  monthlyData: any[]
}

export function MLAnalyticsTab({ events, monthlyData }: MLAnalyticsProps) {
  // Import ML functions
  const { predictFutureValues, analyzeTrend, detectAnomaly, calculateCorrelation, generateExtendedForecast } = require("@/lib/ml-analytics")

  // Prepare data for ML analysis
  const participantTimeSeries = monthlyData.map(d => ({
    date: d.month,
    value: d.participants
  }))

  const revenueTimeSeries = monthlyData.map(d => ({
    date: d.month,
    value: d.revenue
  }))

  const registrationTimeSeries = monthlyData.map(d => ({
    date: d.month,
    value: d.registrations
  }))

  // Generate ML predictions
  const participantPredictions = generateExtendedForecast(participantTimeSeries, 6)
  const revenuePredictions = generateExtendedForecast(revenueTimeSeries, 6)
  const registrationPredictions = generateExtendedForecast(registrationTimeSeries, 6)

  // Trend analysis
  const participantTrend = analyzeTrend(participantTimeSeries)
  const revenueTrend = analyzeTrend(revenueTimeSeries)
  const registrationTrend = analyzeTrend(registrationTimeSeries)

  // Anomaly detection
  const recentParticipants = monthlyData.map(d => d.participants)
  const currentParticipants = recentParticipants[recentParticipants.length - 1] || 0
  const participantAnomaly = detectAnomaly(currentParticipants, recentParticipants.slice(0, -1))

  // Correlation analysis
  const participantRevenueCorr = calculateCorrelation(
    monthlyData.map(d => d.participants),
    monthlyData.map(d => d.revenue)
  )

  const registrationParticipantCorr = calculateCorrelation(
    monthlyData.map(d => d.registrations),
    monthlyData.map(d => d.participants)
  )

  // Combined data for visualization
  const combinedForecastData = [
    ...monthlyData.map((d: any) => ({ ...d, type: 'actual' })),
    ...participantPredictions.map((pred: any, idx: number) => ({
      month: pred.date,
      participants: pred.predicted,
      revenue: revenuePredictions[idx].predicted,
      registrations: registrationPredictions[idx].predicted,
      events: 0,
      satisfaction: 0,
      engagement: 0,
      type: 'predicted',
      confidenceLower: pred.confidence.lower,
      confidenceUpper: pred.confidence.upper
    }))
  ]

  // Calculate comprehensive metrics
  const avgSatisfaction = events.length > 0 
    ? events.reduce((sum, e) => sum + e.satisfaction_score, 0) / events.length 
    : 0
  const avgEngagement = events.length > 0 
    ? events.reduce((sum, e) => sum + e.engagement_score, 0) / events.length 
    : 0
  const avgAttendance = events.length > 0 
    ? events.reduce((sum, e) => sum + e.attendance_rate, 0) / events.length 
    : 0
  const avgConversion = events.length > 0
    ? events.reduce((sum, e) => sum + e.conversion_rate, 0) / events.length
    : 0
  const avgROI = events.length > 0
    ? events.reduce((sum, e) => sum + e.roi, 0) / events.length
    : 0

  // Engagement vs Satisfaction correlation
  const engagementSatisfactionCorr = calculateCorrelation(
    monthlyData.map(d => d.engagement),
    monthlyData.map(d => d.satisfaction)
  )

  // Calculate growth rates
  const participantGrowthRate = participantTimeSeries.length >= 2
    ? ((participantTimeSeries[participantTimeSeries.length - 1].value - participantTimeSeries[0].value) / participantTimeSeries[0].value) * 100
    : 0
  const revenueGrowthRate = revenueTimeSeries.length >= 2
    ? ((revenueTimeSeries[revenueTimeSeries.length - 1].value - revenueTimeSeries[0].value) / revenueTimeSeries[0].value) * 100
    : 0

  // Performance radar data
  const performanceRadarData = [
    { metric: 'Attendance', value: avgAttendance, fullMark: 100 },
    { metric: 'Satisfaction', value: avgSatisfaction * 20, fullMark: 100 },
    { metric: 'Engagement', value: avgEngagement, fullMark: 100 },
    { metric: 'Conversion', value: avgConversion, fullMark: 100 },
    { metric: 'ROI', value: Math.min(Math.max(avgROI, 0), 100), fullMark: 100 },
  ]

  // Event category distribution for pie chart
  const categoryDistribution = events.reduce((acc: any, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1
    return acc
  }, {})

  const pieChartData = Object.entries(categoryDistribution).map(([name, value]: [string, any]) => ({
    name,
    value,
    percentage: ((value / events.length) * 100).toFixed(1)
  }))

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

  // Scatter plot data: Participants vs Revenue
  const scatterData = events.map(event => ({
    participants: event.current_participants,
    revenue: event.revenue,
    satisfaction: event.satisfaction_score,
    name: event.title.substring(0, 20),
  }))

  // Monthly growth rate data
  const monthlyGrowthData = monthlyData.map((month: any, idx: number) => {
    if (idx === 0) return { ...month, participantGrowth: 0, revenueGrowth: 0 }
    const prevMonth = monthlyData[idx - 1]
    return {
      ...month,
      participantGrowth: prevMonth.participants > 0 
        ? ((month.participants - prevMonth.participants) / prevMonth.participants) * 100 
        : 0,
      revenueGrowth: prevMonth.revenue > 0
        ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0,
    }
  })

  return (
    <div className="space-y-8">
      {/* ML Analytics Header */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Brain className="h-10 w-10" />
              <h2 className="text-3xl font-black">AI-Powered Analytics</h2>
            </div>
            <p className="text-indigo-100 text-lg">
              Machine learning insights, predictions, and optimization recommendations
            </p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-bold backdrop-blur-sm">
            <Sparkles className="h-4 w-4 mr-2 inline" />
            Advanced ML
          </Badge>
        </div>
      </div>

      {/* ML KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50 shadow-sm">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-2 py-1 text-xs font-semibold">
                AI Model
              </Badge>
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Prediction Accuracy
            </p>
            <p className="text-3xl font-black text-slate-900 mb-2">
              {(participantTrend.strength * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 font-medium">Model confidence score</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 shadow-sm">
                {participantAnomaly.isAnomaly ? (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <Badge className={`${participantAnomaly.isAnomaly ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'} px-2 py-1 text-xs font-semibold`}>
                {participantAnomaly.isAnomaly ? 'Anomaly' : 'Normal'}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Pattern Status
            </p>
            <p className="text-3xl font-black text-slate-900 mb-2">
              {participantAnomaly.score.toFixed(2)}σ
            </p>
            <p className="text-xs text-slate-500 font-medium">Standard deviations</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50 shadow-sm">
                <LineChart className="h-6 w-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs font-semibold">
                Strong
              </Badge>
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Correlation Score
            </p>
            <p className="text-3xl font-black text-slate-900 mb-2">
              {(participantRevenueCorr * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-slate-500 font-medium">Participants ↔ Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Forecasting */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
            <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
            Predictive Forecasting & Trend Analysis
          </CardTitle>
          <CardDescription className="text-base">
            AI-powered predictions with confidence intervals for the next 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={combinedForecastData}>
              <defs>
                <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 600 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 600 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 600 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontWeight: 600,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return [`₹${value.toLocaleString()}`, name]
                  return [value, name]
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="confidenceUpper"
                fill="#dbeafe"
                stroke="none"
                fillOpacity={0.3}
                name="Confidence Range"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="confidenceLower"
                fill="#fff"
                stroke="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="participants"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5 }}
                name="Participants"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                name="Revenue"
              />
              <ReferenceLine 
                x={monthlyData[monthlyData.length - 1]?.month} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label={{ value: 'Current', position: 'top', fill: '#ef4444', fontWeight: 600 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-bold text-blue-800">Participant Trend</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">
                {participantTrend.trend === 'upward' ? '📈' : participantTrend.trend === 'downward' ? '📉' : '➡️'} 
                {' '}{participantTrend.trend.charAt(0).toUpperCase() + participantTrend.trend.slice(1)}
                {' '}({Math.abs(participantTrend.changeRate).toFixed(1)}% rate)
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-bold text-green-800">Next Month Forecast</span>
              </div>
              <p className="text-sm text-green-700 font-medium">
                {participantTrend.forecast} participants expected
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center mb-2">
                <LineChart className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-bold text-purple-800">Revenue Forecast</span>
              </div>
              <p className="text-sm text-purple-700 font-medium">
                ₹{revenueTrend.forecast.toLocaleString()} projected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection & Pattern Analysis */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>
              Statistical analysis to identify unusual patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participantAnomaly.isAnomaly ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-bold text-red-800">Anomaly Detected</span>
                </div>
                <p className="text-sm text-red-700 font-medium mb-3">
                  Current participant count ({currentParticipants}) is significantly outside expected range.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-red-600 font-semibold mb-1">Expected Range</p>
                    <p className="text-lg font-bold text-red-900">
                      {participantAnomaly.expectedRange.min} - {participantAnomaly.expectedRange.max}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-red-600 font-semibold mb-1">Actual Value</p>
                    <p className="text-lg font-bold text-red-900">{currentParticipants}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-bold text-green-800">Normal Pattern</span>
                </div>
                <p className="text-sm text-green-700 font-medium mb-3">
                  Participant patterns are within expected statistical bounds.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-green-600 font-semibold mb-1">Expected Range</p>
                    <p className="text-lg font-bold text-green-900">
                      {participantAnomaly.expectedRange.min} - {participantAnomaly.expectedRange.max}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-green-600 font-semibold mb-1">Actual Value</p>
                    <p className="text-lg font-bold text-green-900">{currentParticipants}</p>
                  </div>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
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
                <Bar dataKey="participants" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <ReferenceLine 
                  y={participantAnomaly.expectedRange.max} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{ value: 'Upper Bound', position: 'right', fill: '#ef4444', fontSize: 11, fontWeight: 600 }}
                />
                <ReferenceLine 
                  y={participantAnomaly.expectedRange.min} 
                  stroke="#10b981" 
                  strokeDasharray="3 3"
                  label={{ value: 'Lower Bound', position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 600 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-600" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Data-driven suggestions to maximize performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-bold text-blue-900 mb-1">Capitalize on Growth Trend</p>
                  <p className="text-sm text-blue-700 font-medium">
                    {participantTrend.trend === 'upward' 
                      ? `Strong ${Math.abs(participantTrend.changeRate).toFixed(1)}% growth detected. Scale up event capacity and marketing efforts.`
                      : participantTrend.trend === 'downward'
                      ? 'Declining trend detected. Review event quality and participant feedback.'
                      : 'Stable performance. Experiment with new event formats to drive growth.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-bold text-green-900 mb-1">Leverage Strong Correlation</p>
                  <p className="text-sm text-green-700 font-medium">
                    {(participantRevenueCorr * 100).toFixed(0)}% correlation between participants and revenue. 
                    Focus on increasing attendance to boost revenue.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-bold text-purple-900 mb-1">Optimize Event Quality</p>
                  <p className="text-sm text-purple-700 font-medium">
                    Average satisfaction: {avgSatisfaction.toFixed(1)}/5. 
                    {avgSatisfaction >= 4.0 
                      ? ' Excellent! Use testimonials in marketing.'
                      : ' Consider post-event surveys to identify improvement areas.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-bold text-orange-900 mb-1">Improve Engagement</p>
                  <p className="text-sm text-orange-700 font-medium">
                    Current engagement: {avgEngagement.toFixed(0)}%. 
                    {avgEngagement >= 75 
                      ? ' Great engagement! Maintain interactive elements.'
                      : ' Add more interactive sessions and networking opportunities.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Correlation Matrix */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
            <Target className="h-6 w-6 mr-3 text-blue-600" />
            Correlation Analysis & Key Insights
          </CardTitle>
          <CardDescription className="text-base">
            Understanding relationships between different metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">Participants ↔ Revenue</p>
                  <p className="text-3xl font-black text-blue-900">
                    {(participantRevenueCorr * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-white" />
                </div>
              </div>
              <Progress value={Math.abs(participantRevenueCorr) * 100} className="h-2 mb-2" />
              <p className="text-xs text-blue-700 font-medium">
                {Math.abs(participantRevenueCorr) > 0.7 ? 'Strong positive correlation' : 
                 Math.abs(participantRevenueCorr) > 0.4 ? 'Moderate correlation' : 
                 'Weak correlation'}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-1">Registrations ↔ Participants</p>
                  <p className="text-3xl font-black text-green-900">
                    {(registrationParticipantCorr * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <Progress value={Math.abs(registrationParticipantCorr) * 100} className="h-2 mb-2" />
              <p className="text-xs text-green-700 font-medium">
                {Math.abs(registrationParticipantCorr) > 0.7 ? 'Strong positive correlation' : 
                 Math.abs(registrationParticipantCorr) > 0.4 ? 'Moderate correlation' : 
                 'Weak correlation'}
              </p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-start">
              <Award className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-purple-900 text-lg mb-2">Key ML Insights Summary</h4>
                <ul className="space-y-2 text-sm text-purple-800 font-medium">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Model confidence at {(participantTrend.strength * 100).toFixed(1)}% indicates reliable predictions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Forecasted growth of {participantTrend.forecast} participants next month</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Revenue trend shows {revenueTrend.trend} pattern with {Math.abs(revenueTrend.changeRate).toFixed(1)}% change rate</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Strong correlation metrics suggest predictable revenue patterns</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NEW ENHANCED GRAPHS SECTION */}
      
      {/* Performance Radar Chart & Growth Rate Analysis */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <Zap className="h-6 w-6 mr-3 text-orange-600" />
              Multi-Dimensional Performance Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive view of all key performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                />
                <Radar
                  name="Performance Score"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">Overall Score</p>
                <p className="text-2xl font-black text-blue-900">
                  {(performanceRadarData.reduce((sum, d) => sum + d.value, 0) / performanceRadarData.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">Best Metric</p>
                <p className="text-sm font-bold text-green-900">
                  {performanceRadarData.reduce((max, d) => d.value > max.value ? d : max).metric}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <TrendingUp className="h-6 w-6 mr-3 text-green-600" />
              Month-over-Month Growth Rate Analysis
            </CardTitle>
            <CardDescription>
              Track growth velocity and momentum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyGrowthData}>
                <defs>
                  <linearGradient id="participantGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Growth']}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="participantGrowth"
                  fill="url(#participantGrowthGradient)"
                  stroke="#6366f1"
                  strokeWidth={3}
                  name="Participant Growth %"
                />
                <Line
                  type="monotone"
                  dataKey="revenueGrowth"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  name="Revenue Growth %"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-800 mb-1">Participant Growth</p>
                <p className="text-2xl font-black text-indigo-900">
                  {participantGrowthRate > 0 ? '+' : ''}{participantGrowthRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Revenue Growth</p>
                <p className="text-2xl font-black text-emerald-900">
                  {revenueGrowthRate > 0 ? '+' : ''}{revenueGrowthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Plot & Category Distribution */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
              Participants vs Revenue Correlation
            </CardTitle>
            <CardDescription>
              Scatter plot showing relationship between event size and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="participants" 
                  name="Participants"
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  label={{ value: 'Participants', position: 'insideBottom', offset: -5, style: { fontWeight: 600, fill: '#475569' } }}
                />
                <YAxis 
                  dataKey="revenue" 
                  name="Revenue"
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { fontWeight: 600, fill: '#475569' } }}
                />
                <ZAxis dataKey="satisfaction" range={[50, 400]} name="Satisfaction" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Revenue') return [`₹${value.toLocaleString()}`, name]
                    if (name === 'Satisfaction') return [`${value.toFixed(1)}/5`, name]
                    return [value, name]
                  }}
                />
                <Scatter 
                  name="Events" 
                  data={scatterData} 
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center mb-2">
                <LineChart className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-bold text-purple-800">Correlation Insight</span>
              </div>
              <p className="text-sm text-purple-700 font-medium">
                {Math.abs(participantRevenueCorr) > 0.7 
                  ? `Strong ${participantRevenueCorr > 0 ? 'positive' : 'negative'} correlation (${(participantRevenueCorr * 100).toFixed(0)}%) indicates that larger events consistently generate more revenue.`
                  : Math.abs(participantRevenueCorr) > 0.4
                  ? `Moderate correlation (${(participantRevenueCorr * 100).toFixed(0)}%) suggests some relationship between event size and revenue.`
                  : `Weak correlation (${(participantRevenueCorr * 100).toFixed(0)}%) indicates revenue depends on factors beyond just participant count.`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <PieChartIcon className="h-6 w-6 mr-3 text-pink-600" />
              Event Category Distribution
            </CardTitle>
            <CardDescription>
              Portfolio composition and category performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name} (${percentage}%)`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {pieChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} events (${props.payload.percentage}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-xs font-semibold text-pink-800 mb-1">Total Categories</p>
                <p className="text-2xl font-black text-pink-900">{pieChartData.length}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <p className="text-xs font-semibold text-rose-800 mb-1">Most Popular</p>
                <p className="text-sm font-bold text-rose-900">
                  {pieChartData.length > 0 ? pieChartData.reduce((max: any, d: any) => d.value > max.value ? d : max).name : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Metrics Summary */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
            <Award className="h-6 w-6 mr-3 text-indigo-600" />
            Advanced ML Metrics Summary
          </CardTitle>
          <CardDescription className="text-base">
            Comprehensive statistical analysis and predictive insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Avg Attendance</p>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{avgAttendance.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 font-medium">Across all events</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-3">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Avg Conversion</p>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{avgConversion.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 font-medium">Registration to attendance</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-3">
                <Zap className="h-5 w-5 text-orange-600 mr-2" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Avg Engagement</p>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{avgEngagement.toFixed(0)}%</p>
              <p className="text-xs text-slate-500 font-medium">Participant interaction</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-3">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Avg ROI</p>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{avgROI.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 font-medium">Return on investment</p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-200">
            <div className="flex items-start">
              <Sparkles className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-indigo-900 text-lg mb-3">AI-Generated Insights</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-indigo-800">📊 Predictive Analysis</p>
                    <ul className="space-y-1.5 text-sm text-indigo-700 font-medium">
                      <li>• Next month forecast: {participantTrend.forecast} participants</li>
                      <li>• Revenue projection: ₹{revenueTrend.forecast.toLocaleString()}</li>
                      <li>• Model confidence: {(participantTrend.strength * 100).toFixed(1)}%</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-purple-800">🎯 Performance Indicators</p>
                    <ul className="space-y-1.5 text-sm text-purple-700 font-medium">
                      <li>• Participant growth: {participantGrowthRate > 0 ? '+' : ''}{participantGrowthRate.toFixed(1)}%</li>
                      <li>• Revenue growth: {revenueGrowthRate > 0 ? '+' : ''}{revenueGrowthRate.toFixed(1)}%</li>
                      <li>• Engagement-Satisfaction: {(engagementSatisfactionCorr * 100).toFixed(0)}% corr.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
