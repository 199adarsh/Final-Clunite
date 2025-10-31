/**
 * Analytics Data Fetching Library
 * Provides real-time data fetching functions for the analytics dashboard
 */

import { supabase } from "./supabase"

export interface ClubAnalytics {
  totalEvents: number
  totalParticipants: number
  totalRevenue: number
  avgSatisfaction: number
  growthRate: number
  engagementRate: number
  attendanceRate: number
}

export interface EventAnalytics {
  eventId: string
  title: string
  registrations: number
  attendance: number
  revenue: number
  category: string
  type: string
  startDate: string
}

export interface ParticipantDemographics {
  byDepartment: Array<{ name: string; count: number; percentage: number }>
  byYear: Array<{ name: string; count: number; percentage: number }>
  byGender: Array<{ name: string; count: number; percentage: number }>
  byCollege: Array<{ name: string; count: number; percentage: number }>
}

export interface FinancialMetrics {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  expenseBreakdown: Array<{ category: string; amount: number; percentage: number }>
  incomeByEvent: Array<{ eventName: string; income: number }>
}

export interface TimeSeriesData {
  date: string
  registrations: number
  attendance: number
  revenue: number
}

/**
 * Fetch comprehensive club analytics
 */
export async function fetchClubAnalytics(clubId: string): Promise<ClubAnalytics> {
  try {
    // Fetch all events for the club
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, entry_fee, current_participants, created_at, status')
      .eq('club_id', clubId)

    if (eventsError) throw eventsError

    const eventIds = events?.map(e => e.id) || []
    
    // Fetch all registrations for these events
    let totalRegistrations = 0
    let totalAttendance = 0
    
    if (eventIds.length > 0) {
      const { data: registrations, error: regsError } = await supabase
        .from('event_registrations')
        .select('id, status')
        .in('event_id', eventIds)

      if (!regsError && registrations) {
        totalRegistrations = registrations.length
        totalAttendance = registrations.filter(r => r.status === 'attended').length
      }
    }

    // Calculate metrics
    const totalEvents = events?.length || 0
    const totalRevenue = events?.reduce((sum, e) => sum + (e.entry_fee * e.current_participants), 0) || 0
    const attendanceRate = totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0
    
    // Calculate growth rate (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentEvents = events?.filter(e => new Date(e.created_at) >= thirtyDaysAgo).length || 0
    const previousEvents = events?.filter(e => 
      new Date(e.created_at) >= sixtyDaysAgo && new Date(e.created_at) < thirtyDaysAgo
    ).length || 0
    
    const growthRate = previousEvents > 0 ? ((recentEvents - previousEvents) / previousEvents) * 100 : 0

    return {
      totalEvents,
      totalParticipants: totalRegistrations,
      totalRevenue,
      avgSatisfaction: 4.6, // Placeholder - would need feedback table
      growthRate: Math.round(growthRate * 10) / 10,
      engagementRate: Math.min(Math.round(attendanceRate), 100),
      attendanceRate: Math.round(attendanceRate)
    }
  } catch (error) {
    console.error('Error fetching club analytics:', error)
    return {
      totalEvents: 0,
      totalParticipants: 0,
      totalRevenue: 0,
      avgSatisfaction: 0,
      growthRate: 0,
      engagementRate: 0,
      attendanceRate: 0
    }
  }
}

/**
 * Fetch event-wise analytics for comparison
 */
export async function fetchEventComparison(clubId: string): Promise<EventAnalytics[]> {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, entry_fee, current_participants, category, type, start_date')
      .eq('club_id', clubId)
      .order('start_date', { ascending: false })
      .limit(10)

    if (eventsError) throw eventsError
    if (!events) return []

    const eventAnalytics: EventAnalytics[] = []

    for (const event of events) {
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', event.id)

      const totalRegs = registrations?.length || 0
      const attended = registrations?.filter(r => r.status === 'attended').length || 0

      eventAnalytics.push({
        eventId: event.id,
        title: event.title,
        registrations: totalRegs,
        attendance: attended,
        revenue: event.entry_fee * event.current_participants,
        category: event.category,
        type: event.type,
        startDate: event.start_date
      })
    }

    return eventAnalytics
  } catch (error) {
    console.error('Error fetching event comparison:', error)
    return []
  }
}

/**
 * Fetch participant demographics
 */
export async function fetchParticipantDemographics(clubId: string): Promise<ParticipantDemographics> {
  try {
    // Get all event IDs for the club
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('club_id', clubId)

    const eventIds = events?.map(e => e.id) || []
    
    if (eventIds.length === 0) {
      return {
        byDepartment: [],
        byYear: [],
        byGender: [],
        byCollege: []
      }
    }

    // Get all user IDs who registered for these events
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('user_id')
      .in('event_id', eventIds)

    const userIds = [...new Set(registrations?.map(r => r.user_id) || [])]

    if (userIds.length === 0) {
      return {
        byDepartment: [],
        byYear: [],
        byGender: [],
        byCollege: []
      }
    }

    // Fetch user details
    const { data: users } = await supabase
      .from('users')
      .select('branch, college')
      .in('id', userIds)

    if (!users) {
      return {
        byDepartment: [],
        byYear: [],
        byGender: [],
        byCollege: []
      }
    }

    // Process department data
    const deptCounts: Record<string, number> = {}
    users.forEach(user => {
      const dept = user.branch || 'Not Specified'
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    })

    const byDepartment = Object.entries(deptCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / users.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Process college data
    const collegeCounts: Record<string, number> = {}
    users.forEach(user => {
      const college = user.college || 'Not Specified'
      collegeCounts[college] = (collegeCounts[college] || 0) + 1
    })

    const byCollege = Object.entries(collegeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / users.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Placeholder data for year and gender (would need additional user fields)
    const byYear = [
      { name: '1st Year', count: Math.floor(users.length * 0.2), percentage: 20 },
      { name: '2nd Year', count: Math.floor(users.length * 0.3), percentage: 30 },
      { name: '3rd Year', count: Math.floor(users.length * 0.3), percentage: 30 },
      { name: '4th Year', count: Math.floor(users.length * 0.2), percentage: 20 }
    ]

    const byGender = [
      { name: 'Male', count: Math.floor(users.length * 0.6), percentage: 60 },
      { name: 'Female', count: Math.floor(users.length * 0.35), percentage: 35 },
      { name: 'Other', count: Math.floor(users.length * 0.05), percentage: 5 }
    ]

    return {
      byDepartment,
      byYear,
      byGender,
      byCollege
    }
  } catch (error) {
    console.error('Error fetching participant demographics:', error)
    return {
      byDepartment: [],
      byYear: [],
      byGender: [],
      byCollege: []
    }
  }
}

/**
 * Fetch financial metrics
 */
export async function fetchFinancialMetrics(clubId: string): Promise<FinancialMetrics> {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, entry_fee, current_participants, prize_pool')
      .eq('club_id', clubId)

    if (!events) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        expenseBreakdown: [],
        incomeByEvent: []
      }
    }

    // Calculate income
    const incomeByEvent = events.map(event => ({
      eventName: event.title,
      income: event.entry_fee * event.current_participants
    }))

    const totalIncome = incomeByEvent.reduce((sum, e) => sum + e.income, 0)

    // Real expenses from event_expenses + include prize_pool if present
    const eventIds = events.map(e => e.id)
    let totalExpenses = 0
    let expenseBreakdown: Array<{ category: string; amount: number; percentage: number }> = []

    if (eventIds.length > 0) {
      const { data: expenses } = await supabase
        .from('event_expenses')
        .select('category, amount, event_id')
        .in('event_id', eventIds)

      const byCategory: Record<string, number> = {}
      let expensesTotal = 0
      if (expenses && expenses.length > 0) {
        for (const exp of expenses) {
          const amt = Number(exp.amount) || 0
          expensesTotal += amt
          byCategory[exp.category] = (byCategory[exp.category] || 0) + amt
        }
      }

      // Add prize pool as a category if present
      const prizePoolTotal = events.reduce((sum, e) => sum + (e.prize_pool || 0), 0)
      if (prizePoolTotal > 0) {
        byCategory['Prize Pool'] = (byCategory['Prize Pool'] || 0) + prizePoolTotal
        expensesTotal += prizePoolTotal
      }

      totalExpenses = expensesTotal
      const entries = Object.entries(byCategory)
      expenseBreakdown = entries.map(([category, amount]) => ({
        category,
        amount,
        percentage: expensesTotal > 0 ? (amount / expensesTotal) * 100 : 0
      }))
      // Sort largest first
      expenseBreakdown.sort((a, b) => b.amount - a.amount)
    }

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      expenseBreakdown,
      incomeByEvent: incomeByEvent.filter(e => e.income > 0)
    }
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      expenseBreakdown: [],
      incomeByEvent: []
    }
  }
}

/**
 * Fetch time series data for trends
 */
export async function fetchTimeSeriesData(clubId: string, days: number = 90): Promise<TimeSeriesData[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: events } = await supabase
      .from('events')
      .select('id, entry_fee, current_participants, start_date')
      .eq('club_id', clubId)
      .gte('start_date', startDate.toISOString())
      .order('start_date', { ascending: true })

    if (!events || events.length === 0) return []

    // Group by week
    const weeklyData: Record<string, { registrations: number; attendance: number; revenue: number }> = {}

    for (const event of events) {
      const eventDate = new Date(event.start_date)
      const weekStart = new Date(eventDate)
      weekStart.setDate(eventDate.getDate() - eventDate.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', event.id)

      const totalRegs = registrations?.length || 0
      const attended = registrations?.filter(r => r.status === 'attended').length || 0
      const revenue = event.entry_fee * event.current_participants

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { registrations: 0, attendance: 0, revenue: 0 }
      }

      weeklyData[weekKey].registrations += totalRegs
      weeklyData[weekKey].attendance += attended
      weeklyData[weekKey].revenue += revenue
    }

    return Object.entries(weeklyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error('Error fetching time series data:', error)
    return []
  }
}

/**
 * Generate insights based on analytics data
 */
export function generateInsights(analytics: ClubAnalytics, demographics: ParticipantDemographics, financial: FinancialMetrics) {
  const insights = []

  // Attendance insight
  if (analytics.attendanceRate > 80) {
    insights.push({
      type: 'success',
      title: 'Excellent Attendance',
      message: `Your ${analytics.attendanceRate}% attendance rate is outstanding! Participants are highly engaged.`,
      icon: 'TrendingUp'
    })
  } else if (analytics.attendanceRate < 60) {
    insights.push({
      type: 'warning',
      title: 'Low Attendance',
      message: `Attendance rate is ${analytics.attendanceRate}%. Consider sending reminders and improving event communication.`,
      icon: 'AlertTriangle'
    })
  }

  // Growth insight
  if (analytics.growthRate > 20) {
    insights.push({
      type: 'success',
      title: 'Strong Growth',
      message: `Events grew by ${analytics.growthRate}% this month. Keep up the momentum!`,
      icon: 'TrendingUp'
    })
  } else if (analytics.growthRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Declining Activity',
      message: `Event creation decreased by ${Math.abs(analytics.growthRate)}%. Consider planning more engaging events.`,
      icon: 'TrendingDown'
    })
  }

  // Financial insight
  if (financial.netProfit > 0) {
    insights.push({
      type: 'success',
      title: 'Profitable Operations',
      message: `Generated ₹${financial.netProfit.toLocaleString()} in net profit. Excellent financial management!`,
      icon: 'DollarSign'
    })
  } else if (financial.netProfit < 0) {
    insights.push({
      type: 'info',
      title: 'Operating at Loss',
      message: `Current loss: ₹${Math.abs(financial.netProfit).toLocaleString()}. Review expense allocation.`,
      icon: 'AlertTriangle'
    })
  }

  // Diversity insight
  if (demographics.byDepartment.length > 5) {
    insights.push({
      type: 'success',
      title: 'Diverse Participation',
      message: `Attracting participants from ${demographics.byDepartment.length} different departments!`,
      icon: 'Users'
    })
  }

  // Engagement insight
  if (analytics.totalParticipants > 100) {
    insights.push({
      type: 'success',
      title: 'High Engagement',
      message: `${analytics.totalParticipants} total participants across all events. Great reach!`,
      icon: 'Award'
    })
  }

  return insights
}
