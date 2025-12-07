"use client"

import { useState, useEffect } from "react"
import { supabase, type Event, type Club } from "@/lib/supabase"

interface EventWithClub extends Event {
  club?: Club
}

export function useEvents() {
  const [events, setEvents] = useState<EventWithClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date().toISOString()

      const { data, error: fetchError } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*)
        `)
        .eq("status", "published")
        .gt("registration_deadline", now)
        .order("registration_deadline", { ascending: true })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error("Error fetching events:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  }
}

export function useClubEvents(clubId: string) {
  const [events, setEvents] = useState<EventWithClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClubEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*)
        `)
        .eq("club_id", clubId)
        .eq("status", "published")
        .order("start_date", { ascending: true })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error("Error fetching club events:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clubId) {
      fetchClubEvents()
    }
  }, [clubId])

  return {
    events,
    loading,
    error,
    refetch: fetchClubEvents,
  }
}

export function useEventsForClubIds(clubIds: string[]) {
  const [events, setEvents] = useState<EventWithClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!clubIds || clubIds.length === 0) {
        setEvents([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from("events")
        .select(`
          *,
          club:clubs(*)
        `)
        .in("club_id", clubIds)
        .eq("status", "published")
        .order("start_date", { ascending: true })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error("Error fetching events for club ids:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    // We want to refetch whenever the set of clubIds changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(clubIds)])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  }
}
