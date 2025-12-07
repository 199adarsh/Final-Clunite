"use client"

import { useState, useEffect } from "react"
import { supabase, type EventRegistration, type User } from "@/lib/supabase"

interface EventParticipant extends EventRegistration {
  user: User
}

export function useEventParticipants(eventId: string) {
  const [participants, setParticipants] = useState<EventParticipant[]>([])
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!eventId) {
        setParticipants([])
        setEventDetails(null)
        return
      }

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError) throw eventError
      setEventDetails(eventData)

      // Fetch participants
      const { data, error: fetchError } = await supabase
        .from("event_registrations")
        .select(`
          *,
          user:users(*),
          registration_data
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false })

      if (fetchError) throw fetchError

      // Process the data to handle registrations without user_id
      const processedParticipants = (data || []).map(registration => {
        // If there's no user_id but we have registration_data, create a virtual user
        if (!registration.user_id && registration.registration_data) {
          const regData = registration.registration_data
          
          // For solo events, get participant details
          if (regData.participant_details) {
            return {
              ...registration,
              user: {
                id: `virtual_${registration.id}`,
                full_name: regData.participant_details.name,
                email: regData.participant_details.email,
                college: regData.participant_details.college,
                phone: regData.participant_details.phone,
                created_at: registration.registered_at,
                updated_at: registration.registered_at
              }
            }
          }
          
          // For team events, create entries for each team member
          if (regData.team_members && Array.isArray(regData.team_members)) {
            // Return the first team member as the main registration
            // We'll handle multiple team members separately
            const firstMember = regData.team_members[0]
            return {
              ...registration,
              user: {
                id: `virtual_${registration.id}_0`,
                full_name: firstMember.name,
                email: firstMember.email,
                college: firstMember.college,
                phone: firstMember.phone,
                created_at: registration.registered_at,
                updated_at: registration.registered_at
              }
            }
          }
        }
        
        return registration
      })

      // For team events, expand team members into separate participant entries
      const expandedParticipants: any[] = []
      
      processedParticipants.forEach(registration => {
        if (registration.registration_data?.team_members && Array.isArray(registration.registration_data.team_members)) {
          // Create a separate entry for each team member
          registration.registration_data.team_members.forEach((member: any, index: number) => {
            expandedParticipants.push({
              ...registration,
              id: `${registration.id}_member_${index}`,
              user: {
                id: `virtual_${registration.id}_${index}`,
                full_name: member.name,
                email: member.email,
                college: member.college,
                phone: member.phone,
                created_at: registration.registered_at,
                updated_at: registration.registered_at
              }
            })
          })
        } else {
          expandedParticipants.push(registration)
        }
      })

      setParticipants(expandedParticipants)
    } catch (err) {
      console.error("Error fetching event participants:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [eventId])

  const getParticipantsByStatus = (status: string) => {
    return participants.filter(participant => participant.status === status)
  }

  const getParticipantStats = () => {
    return {
      total: participants.length,
      registered: getParticipantsByStatus("registered").length,
      waitlisted: getParticipantsByStatus("waitlisted").length,
      cancelled: getParticipantsByStatus("cancelled").length,
      attended: getParticipantsByStatus("attended").length,
    }
  }

  const updateParticipantStatus = async (participantId: string, newStatus: "registered" | "waitlisted" | "cancelled" | "attended") => {
    try {
      // Handle virtual participant IDs (for team members)
      const actualRegistrationId = participantId.includes('_member_') 
        ? participantId.split('_member_')[0]
        : participantId

      const { error } = await supabase
        .from("event_registrations")
        .update({ status: newStatus })
        .eq("id", actualRegistrationId)

      if (error) throw error

      // Update local state - for team members, update all members of the same registration
      setParticipants(prev => 
        prev.map(participant => {
          const pRegistrationId = participant.id.includes('_member_') 
            ? participant.id.split('_member_')[0]
            : participant.id
          
          if (pRegistrationId === actualRegistrationId) {
            return { ...participant, status: newStatus }
          }
          return participant
        })
      )

      return { success: true }
    } catch (err) {
      console.error("Error updating participant status:", err)
      return { success: false, error: err instanceof Error ? err.message : "An error occurred" }
    }
  }

  return {
    participants,
    eventDetails,
    loading,
    error,
    refetch: fetchParticipants,
    getParticipantsByStatus,
    getParticipantStats,
    updateParticipantStatus,
  }
}

export function useOrganizerEvents(userId?: string) {
  const [events, setEvents] = useState<any[]>([])
  const [userClubs, setUserClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user if not provided
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      console.log('=== FETCHING EVENTS FOR USER ===')
      console.log('User ID:', currentUserId)
      
      // DEBUG: Check if there are ANY events in the database
      const { data: allEventsDebug, count: totalEventsCount } = await supabase
        .from('events')
        .select('id, title, club_id, created_by', { count: 'exact' })
      
      console.log('DEBUG: Total events in database:', totalEventsCount)
      console.log('DEBUG: All events:', allEventsDebug)

      // First, get all clubs where user is an admin OR creator
      const { data: memberships, error: membershipsError } = await supabase
        .from('club_memberships')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('user_id', currentUserId)
        .eq('role', 'admin')

      console.log('Club memberships found:', memberships?.length || 0, memberships)

      if (membershipsError) {
        console.error('Memberships error:', membershipsError)
        throw membershipsError
      }

      // Also get clubs created by the user
      const { data: createdClubs, error: createdClubsError } = await supabase
        .from('clubs')
        .select('*')
        .eq('created_by', currentUserId)

      console.log('Created clubs found:', createdClubs)

      if (createdClubsError) {
        console.error('Created clubs error:', createdClubsError)
      }

      // Combine both sources of clubs
      const allClubs = [
        ...(memberships || []).map((m: any) => m.club),
        ...(createdClubs || [])
      ]
      
      // Remove duplicates by club id
      const uniqueClubs = Array.from(new Map(allClubs.map(club => [club.id, club])).values())
      const clubIds = uniqueClubs.map(club => club.id)
      
      console.log('All club IDs:', clubIds)
      
      setUserClubs(uniqueClubs)

      // Fetch events for user's clubs (if any)
      let eventsData: any[] = []
      if (clubIds.length > 0) {
        const { data, error: eventsError } = await supabase
          .from("events")
          .select(`
            *,
            club:clubs(*),
            event_registrations(
              id,
              status,
              registered_at
            )
          `)
          .in('club_id', clubIds)
          .order("created_at", { ascending: false })

        console.log('Events fetched for clubs:', data)
        console.log('Events error:', eventsError)
        
        if (!eventsError) {
          eventsData = data || []
        }
      } else {
        console.log('No clubs found for user, will check for user-created events')
      }
      
      // ALSO fetch events created by the user directly (in case club membership isn't set up)
      const { data: userEvents, error: userEventsError } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*),
          event_registrations(
            id,
            status,
            registered_at
          )
        `)
        .eq('created_by', currentUserId)
        .order("created_at", { ascending: false })
      
      console.log('Events created by user:', userEvents)
      
      // Combine and deduplicate events
      const allEvents = [...eventsData, ...(userEvents || [])]
      const uniqueEvents = Array.from(new Map(allEvents.map(event => [event.id, event])).values())
      
      console.log('Total unique events:', uniqueEvents.length)
      
      // If no events at all, return empty
      if (uniqueEvents.length === 0) {
        console.log('No events found for user')
        setEvents([])
        setLoading(false)
        return
      }

      // Process events to include participant statistics
      const eventsWithStats = await Promise.all(uniqueEvents.map(async (event: any) => {
        // Fetch full registration data including registration_data field
        const { data: fullRegistrations } = await supabase
          .from('event_registrations')
          .select('id, status, registration_data, user_id')
          .eq('event_id', event.id)
        
        console.log(`Event "${event.title}" registrations:`, fullRegistrations)
        
        const registrations = fullRegistrations || []
        
        // Count actual participants (including team members)
        let totalParticipants = 0
        let registeredCount = 0
        let waitlistedCount = 0
        let cancelledCount = 0
        let attendedCount = 0
        
        registrations.forEach((reg: any) => {
          console.log(`Processing registration ${reg.id}:`, {
            status: reg.status,
            hasTeamMembers: !!reg.registration_data?.team_members,
            teamSize: reg.registration_data?.team_members?.length || 0
          })
          
          // Check if this is a team registration
          if (reg.registration_data?.team_members && Array.isArray(reg.registration_data.team_members)) {
            const teamSize = reg.registration_data.team_members.length
            totalParticipants += teamSize
            
            // Count by status
            if (reg.status === 'registered') registeredCount += teamSize
            else if (reg.status === 'waitlisted') waitlistedCount += teamSize
            else if (reg.status === 'cancelled') cancelledCount += teamSize
            else if (reg.status === 'attended') attendedCount += teamSize
          } else {
            // Solo registration or regular user registration
            totalParticipants += 1
            
            // Count by status
            if (reg.status === 'registered') registeredCount += 1
            else if (reg.status === 'waitlisted') waitlistedCount += 1
            else if (reg.status === 'cancelled') cancelledCount += 1
            else if (reg.status === 'attended') attendedCount += 1
          }
        })
        
        const stats = {
          total: totalParticipants,
          registered: registeredCount,
          waitlisted: waitlistedCount,
          cancelled: cancelledCount,
          attended: attendedCount,
        }

        console.log(`Event "${event.title}" final stats:`, stats)

        return {
          ...event,
          participantStats: stats,
          hasParticipants: stats.total > 0
        }
      }))

      setEvents(eventsWithStats)
    } catch (err) {
      console.error("Error fetching organizer events:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizerEvents()
  }, [userId])

  return {
    events,
    userClubs,
    loading,
    error,
    refetch: fetchOrganizerEvents,
  }
}

export function useParticipantsSummary(eventIds: string[]) {
  const [summary, setSummary] = useState({
    totalParticipants: 0,
    registeredCount: 0,
    attendedCount: 0,
    waitlistedCount: 0,
    cancelledCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!eventIds || eventIds.length === 0) {
        setSummary({
          totalParticipants: 0,
          registeredCount: 0,
          attendedCount: 0,
          waitlistedCount: 0,
          cancelledCount: 0,
        })
        return
      }

      const { data, error: fetchError } = await supabase
        .from("event_registrations")
        .select("status")
        .in("event_id", eventIds)

      if (fetchError) throw fetchError

      const statusCounts = (data || []).reduce((acc, registration) => {
        acc[registration.status] = (acc[registration.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setSummary({
        totalParticipants: data?.length || 0,
        registeredCount: statusCounts.registered || 0,
        attendedCount: statusCounts.attended || 0,
        waitlistedCount: statusCounts.waitlisted || 0,
        cancelledCount: statusCounts.cancelled || 0,
      })
    } catch (err) {
      console.error("Error fetching participants summary:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [JSON.stringify(eventIds)])

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  }
}
