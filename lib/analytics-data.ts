/**
 * Analytics Data Fetching Library
 * Provides real-time data fetching functions for the analytics dashboard
 */

import { supabase } from './supabase';

export interface ClubAnalytics {
  totalEvents: number;
  totalParticipants: number;
  totalRevenue: number;
  avgSatisfaction: number;
  growthRate: number;
  engagementRate: number;
  attendanceRate: number;
}

export interface EventAnalytics {
  eventId: string;
  title: string;
  registrations: number;
  attendance: number;
  revenue: number;
  category: string;
  type: string;
  startDate: string;
}

export interface ParticipantDemographics {
  byDepartment: Array<{ name: string; count: number; percentage: number }>;
  byYear: Array<{ name: string; count: number; percentage: number }>;
  byGender: Array<{ name: string; count: number; percentage: number }>;
  byCollege: Array<{ name: string; count: number; percentage: number }>;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  incomeByEvent: Array<{ eventName: string; income: number }>;
}

export interface TimeSeriesData {
  date: string;
  registrations: number;
  attendance: number;
  revenue: number;
}

/**
 * Fetch comprehensive club analytics
 */
export async function fetchClubAnalytics(
  clubId: string
): Promise<ClubAnalytics> {
  try {
    // Fetch all events for the club
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, entry_fee, current_participants, created_at, status')
      .eq('club_id', clubId);

    if (eventsError) throw eventsError;

    const eventIds = events?.map((e: any) => e.id) || [];

    // Fetch all registrations for these events
    let totalRegistrations = 0;
    let totalAttendance = 0;

    if (eventIds.length > 0) {
      const { data: registrations, error: regsError } = await supabase
        .from('event_registrations')
        .select('id, status')
        .in('event_id', eventIds);

      if (!regsError && registrations) {
        totalRegistrations = registrations.length;
        totalAttendance = registrations.filter(
          (r: any) => r.status === 'attended'
        ).length;
      }
    }

    // Calculate metrics
    const totalEvents = events?.length || 0;
    const totalRevenue =
      events?.reduce(
        (sum: number, e: any) => sum + e.entry_fee * e.current_participants,
        0
      ) || 0;
    const attendanceRate =
      totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0;

    // Calculate growth rate (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentEvents =
      events?.filter((e: any) => new Date(e.created_at) >= thirtyDaysAgo).length ||
      0;
    const previousEvents =
      events?.filter(
        (e: any) =>
          new Date(e.created_at) >= sixtyDaysAgo &&
          new Date(e.created_at) < thirtyDaysAgo
      ).length || 0;

    const growthRate =
      previousEvents > 0
        ? ((recentEvents - previousEvents) / previousEvents) * 100
        : 0;

    return {
      totalEvents,
      totalParticipants: totalRegistrations,
      totalRevenue,
      avgSatisfaction: 4.6, // Placeholder - would need feedback table
      growthRate: Math.round(growthRate * 10) / 10,
      engagementRate: Math.min(Math.round(attendanceRate), 100),
      attendanceRate: Math.round(attendanceRate),
    };
  } catch (error) {
    console.error('Error fetching club analytics:', error);
    return {
      totalEvents: 0,
      totalParticipants: 0,
      totalRevenue: 0,
      avgSatisfaction: 0,
      growthRate: 0,
      engagementRate: 0,
      attendanceRate: 0,
    };
  }
}

/**
 * Fetch event-wise analytics for comparison
 */
export async function fetchEventComparison(
  clubId: string
): Promise<EventAnalytics[]> {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        'id, title, entry_fee, current_participants, category, type, start_date'
      )
      .eq('club_id', clubId)
      .order('start_date', { ascending: false })
      .limit(10);

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return [];

    const eventIds = events.map((e: any) => e.id);

    // Fetch all registrations in a single query to avoid N+1 queries
    const { data: registrations, error: regsError } = await supabase
      .from('event_registrations')
      .select('event_id, status')
      .in('event_id', eventIds);

    if (regsError) throw regsError;

    // Group registrations by event_id
    const regsMap = ((registrations || []) as any[]).reduce<Record<string, any[]>>((acc, reg) => {
      if (!acc[reg.event_id]) acc[reg.event_id] = [];
      acc[reg.event_id].push(reg);
      return acc;
    }, {});

    return events.map((event: any) => {
      const eventRegs = regsMap[event.id] || [];
      const totalRegs = eventRegs.length;
      const attended = eventRegs.filter((r: any) => r.status === 'attended').length;

      return {
        eventId: event.id,
        title: event.title,
        registrations: totalRegs,
        attendance: attended,
        revenue: event.entry_fee * event.current_participants,
        category: event.category,
        type: event.type,
        startDate: event.start_date,
      };
    });
  } catch (error) {
    console.error('Error fetching event comparison:', error);
    return [];
  }
}

/**
 * Fetch participant demographics
 */
export async function fetchParticipantDemographics(
  clubId: string
): Promise<ParticipantDemographics> {
  try {
    // Get all event IDs for the club
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('club_id', clubId);

    const eventIds = events?.map((e: any) => e.id) || [];

    if (eventIds.length === 0) {
      return {
        byDepartment: [],
        byYear: [],
        byGender: [],
        byCollege: [],
      };
    }

    // Fetch user IDs and registration data in a single call to avoid consecutive queries
    const { data: registrations, error: regsError } = await supabase
      .from('event_registrations')
      .select('user_id, registration_data')
      .in('event_id', eventIds);

    if (regsError || !registrations || registrations.length === 0) {
      return {
        byDepartment: [],
        byYear: [],
        byGender: [],
        byCollege: [],
      };
    }

    const userIds = [...new Set(registrations.map((r: any) => r.user_id))];
    const allRegistrations = registrations;

    // Extract department (branch) from registrations
    const deptCounts: Record<string, number> = {};
    let totalDeptParticipants = 0;

    if (allRegistrations) {
      for (const reg of allRegistrations) {
        const regData = reg.registration_data;
        if (!regData) continue;

        // Handle solo registrations
        if (
          regData.participant_details?.branch ||
          regData.additional_info?.branch
        ) {
          const branch = (
            regData.participant_details?.branch ||
            regData.additional_info?.branch
          ).trim();
          if (branch) {
            deptCounts[branch] = (deptCounts[branch] || 0) + 1;
            totalDeptParticipants++;
          }
        }

        // Handle team registrations
        if (regData.team_members && Array.isArray(regData.team_members)) {
          for (const member of regData.team_members) {
            if (member.branch) {
              const branch = member.branch.trim();
              if (branch) {
                deptCounts[branch] = (deptCounts[branch] || 0) + 1;
                totalDeptParticipants++;
              }
            }
          }
        }
      }
    }

    const byDepartment = Object.entries(deptCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalDeptParticipants > 0 ? (count / totalDeptParticipants) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Extract college from registrations
    const collegeCounts: Record<string, number> = {};
    let totalCollegeParticipants = 0;

    if (allRegistrations) {
      for (const reg of allRegistrations) {
        const regData = reg.registration_data;
        if (!regData) continue;

        // Handle solo registrations
        if (regData.participant_details?.college) {
          const college = regData.participant_details.college.trim();
          if (college) {
            collegeCounts[college] = (collegeCounts[college] || 0) + 1;
            totalCollegeParticipants++;
          }
        }

        // Handle team registrations
        if (regData.team_members && Array.isArray(regData.team_members)) {
          for (const member of regData.team_members) {
            if (member.college) {
              const college = member.college.trim();
              if (college) {
                collegeCounts[college] = (collegeCounts[college] || 0) + 1;
                totalCollegeParticipants++;
              }
            }
          }
        }
      }
    }

    const byCollege = Object.entries(collegeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalCollegeParticipants > 0
            ? (count / totalCollegeParticipants) * 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Extract year of study from registrations
    const yearCounts: Record<string, number> = {};
    let totalYearParticipants = 0;

    if (allRegistrations) {
      for (const reg of allRegistrations) {
        const regData = reg.registration_data;
        if (!regData) continue;

        // Handle solo registrations
        if (regData.participant_details?.year) {
          const year = regData.participant_details.year.trim();
          if (year) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
            totalYearParticipants++;
          }
        }

        // Handle team registrations
        if (regData.team_members && Array.isArray(regData.team_members)) {
          for (const member of regData.team_members) {
            if (member.year) {
              const year = member.year.trim();
              if (year) {
                yearCounts[year] = (yearCounts[year] || 0) + 1;
                totalYearParticipants++;
              }
            }
          }
        }
      }
    }

    const byYear = Object.entries(yearCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalYearParticipants > 0 ? (count / totalYearParticipants) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Extract gender from registrations
    const genderCounts: Record<string, number> = {};
    let totalGenderParticipants = 0;

    if (allRegistrations) {
      for (const reg of allRegistrations) {
        const regData = reg.registration_data;
        if (!regData) continue;

        // Handle solo registrations
        if (regData.participant_details?.gender) {
          const gender = regData.participant_details.gender.trim();
          if (gender) {
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
            totalGenderParticipants++;
          }
        }

        // Handle team registrations
        if (regData.team_members && Array.isArray(regData.team_members)) {
          for (const member of regData.team_members) {
            if (member.gender) {
              const gender = member.gender.trim();
              if (gender) {
                genderCounts[gender] = (genderCounts[gender] || 0) + 1;
                totalGenderParticipants++;
              }
            }
          }
        }
      }
    }

    const byGender = Object.entries(genderCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        count,
        percentage:
          totalGenderParticipants > 0
            ? (count / totalGenderParticipants) * 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      byDepartment,
      byYear,
      byGender,
      byCollege,
    };
  } catch (error) {
    console.error('Error fetching participant demographics:', error);
    return {
      byDepartment: [],
      byYear: [],
      byGender: [],
      byCollege: [],
    };
  }
}

/**
 * Fetch financial metrics
 */
export async function fetchFinancialMetrics(
  clubId: string
): Promise<FinancialMetrics> {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, entry_fee, current_participants, prize_pool')
      .eq('club_id', clubId);

    if (!events) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        expenseBreakdown: [],
        incomeByEvent: [],
      };
    }

    // Calculate income from entry fees
    const incomeByEvent = events.map((event: any) => ({
      eventName: event.title,
      income: event.entry_fee * event.current_participants,
    }));

    // Separate income and expenses from event_expenses based on type field
    const eventIds = events.map((e: any) => e.id);
    let totalExpenses = 0;
    let totalIncomeFromEntries = 0;
    let expenseBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }> = [];
    let incomeBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }> = [];

    if (eventIds.length > 0) {
      const { data: financialEntries } = await supabase
        .from('event_expenses')
        .select('category, amount, event_id, type')
        .in('event_id', eventIds);

      const expenseByCategory: Record<string, number> = {};
      const incomeByCategory: Record<string, number> = {};
      let expensesTotal = 0;
      let incomeTotal = 0;

      if (financialEntries && financialEntries.length > 0) {
        for (const entry of financialEntries) {
          const amt = Number(entry.amount) || 0;
          const entryType = entry.type || 'expense'; // Default to expense if type not present

          if (entryType === 'income') {
            incomeTotal += amt;
            incomeByCategory[entry.category] =
              (incomeByCategory[entry.category] || 0) + amt;
          } else {
            expensesTotal += amt;
            expenseByCategory[entry.category] =
              (expenseByCategory[entry.category] || 0) + amt;
          }
        }
      }

      // Add prize pool as an expense category if present
      const prizePoolTotal = events.reduce(
        (sum: number, e: any) => sum + (e.prize_pool || 0),
        0
      );
      if (prizePoolTotal > 0) {
        expenseByCategory['Prize Pool'] =
          (expenseByCategory['Prize Pool'] || 0) + prizePoolTotal;
        expensesTotal += prizePoolTotal;
      }

      totalExpenses = expensesTotal;
      totalIncomeFromEntries = incomeTotal;

      // Process expense breakdown
      const expenseEntries = Object.entries(expenseByCategory);
      expenseBreakdown = expenseEntries.map(([category, amount]) => ({
        category,
        amount,
        percentage: expensesTotal > 0 ? (amount / expensesTotal) * 100 : 0,
      }));
      expenseBreakdown.sort((a, b) => b.amount - a.amount);

      // Process income breakdown (for potential future use)
      const incomeEntries = Object.entries(incomeByCategory);
      incomeBreakdown = incomeEntries.map(([category, amount]) => ({
        category,
        amount,
        percentage: incomeTotal > 0 ? (amount / incomeTotal) * 100 : 0,
      }));
      incomeBreakdown.sort((a, b) => b.amount - a.amount);
    }

    // Calculate total income: entry fees + income entries
    const totalIncome =
      incomeByEvent.reduce((sum: number, e: any) => sum + e.income, 0) +
      totalIncomeFromEntries;

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      expenseBreakdown,
      incomeByEvent: incomeByEvent.filter((e: any) => e.income > 0),
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      expenseBreakdown: [],
      incomeByEvent: [],
    };
  }
}

/**
 * Fetch time series data for trends
 */
export async function fetchTimeSeriesData(
  clubId: string,
  days: number = 90
): Promise<TimeSeriesData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, entry_fee, current_participants, start_date')
      .eq('club_id', clubId)
      .gte('start_date', startDate.toISOString())
      .order('start_date', { ascending: true });

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return [];

    const eventIds = events.map((e: any) => e.id);

    // Fetch all registrations in one query to avoid N+1 loop queries
    const { data: registrations, error: regsError } = await supabase
      .from('event_registrations')
      .select('event_id, status')
      .in('event_id', eventIds);

    if (regsError) throw regsError;

    // Group registrations by event_id
    const regsMap = ((registrations || []) as any[]).reduce<Record<string, any[]>>((acc, reg) => {
      if (!acc[reg.event_id]) acc[reg.event_id] = [];
      acc[reg.event_id].push(reg);
      return acc;
    }, {});

    // Group by week
    const weeklyData: Record<
      string,
      { registrations: number; attendance: number; revenue: number }
    > = {};

    for (const event of events) {
      const eventDate = new Date(event.start_date);
      const weekStart = new Date(eventDate);
      weekStart.setDate(eventDate.getDate() - eventDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const eventRegs = regsMap[event.id] || [];
      const totalRegs = eventRegs.length;
      const attended = eventRegs.filter((r: any) => r.status === 'attended').length;
      const revenue = event.entry_fee * event.current_participants;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { registrations: 0, attendance: 0, revenue: 0 };
      }

      weeklyData[weekKey].registrations += totalRegs;
      weeklyData[weekKey].attendance += attended;
      weeklyData[weekKey].revenue += revenue;
    }

    return Object.entries(weeklyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return [];
  }
}

/**
 * Generate insights based on analytics data
 */
export function generateInsights(
  analytics: ClubAnalytics,
  demographics: ParticipantDemographics,
  financial: FinancialMetrics
) {
  const insights = [];

  // Attendance insight
  if (analytics.attendanceRate > 80) {
    insights.push({
      type: 'success',
      title: 'Excellent Attendance',
      message: `Your ${analytics.attendanceRate}% attendance rate is outstanding! Participants are highly engaged.`,
      icon: 'TrendingUp',
    });
  } else if (analytics.attendanceRate < 60) {
    insights.push({
      type: 'warning',
      title: 'Low Attendance',
      message: `Attendance rate is ${analytics.attendanceRate}%. Consider sending reminders and improving event communication.`,
      icon: 'AlertTriangle',
    });
  }

  // Growth insight
  if (analytics.growthRate > 20) {
    insights.push({
      type: 'success',
      title: 'Strong Growth',
      message: `Events grew by ${analytics.growthRate}% this month. Keep up the momentum!`,
      icon: 'TrendingUp',
    });
  } else if (analytics.growthRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Declining Activity',
      message: `Event creation decreased by ${Math.abs(analytics.growthRate)}%. Consider planning more engaging events.`,
      icon: 'TrendingDown',
    });
  }

  // Financial insight
  if (financial.netProfit > 0) {
    insights.push({
      type: 'success',
      title: 'Profitable Operations',
      message: `Generated ₹${financial.netProfit.toLocaleString()} in net profit. Excellent financial management!`,
      icon: 'DollarSign',
    });
  } else if (financial.netProfit < 0) {
    insights.push({
      type: 'info',
      title: 'Operating at Loss',
      message: `Current loss: ₹${Math.abs(financial.netProfit).toLocaleString()}. Review expense allocation.`,
      icon: 'AlertTriangle',
    });
  }

  // Diversity insight
  if (demographics.byDepartment.length > 5) {
    insights.push({
      type: 'success',
      title: 'Diverse Participation',
      message: `Attracting participants from ${demographics.byDepartment.length} different departments!`,
      icon: 'Users',
    });
  }

  // Engagement insight
  if (analytics.totalParticipants > 100) {
    insights.push({
      type: 'success',
      title: 'High Engagement',
      message: `${analytics.totalParticipants} total participants across all events. Great reach!`,
      icon: 'Award',
    });
  }

  return insights;
}
