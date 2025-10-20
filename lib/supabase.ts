import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton client for browser
let client: ReturnType<typeof createBrowserClient> | null = null

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create new client each time
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: reuse singleton
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
})()

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: "student" | "organizer" | "admin"
          college: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: "student" | "organizer" | "admin"
          college: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: "student" | "organizer" | "admin"
          college?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          tagline: string | null
          description: string | null
          vision: string | null
          category: string
          college: string
          founding_date: string | null
          contact_email: string | null
          faculty_in_charge: string | null
          members_count: number
          events_hosted_count: number
          credibility_score: number
          logo_url: string | null
          banner_url: string | null
          social_links: any | null
          is_verified: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline?: string | null
          description?: string | null
          vision?: string | null
          category: string
          college: string
          founding_date?: string | null
          contact_email?: string | null
          faculty_in_charge?: string | null
          members_count?: number
          events_hosted_count?: number
          credibility_score?: number
          logo_url?: string | null
          banner_url?: string | null
          social_links?: any | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string | null
          description?: string | null
          vision?: string | null
          category?: string
          college?: string
          founding_date?: string | null
          contact_email?: string | null
          faculty_in_charge?: string | null
          members_count?: number
          events_hosted_count?: number
          credibility_score?: number
          logo_url?: string | null
          banner_url?: string | null
          social_links?: any | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          club_id: string | null
          college: string
          category: string
          type:
            | "workshop"
            | "competition"
            | "seminar"
            | "cultural"
            | "sports"
            | "hackathon"
            | "conference"
            | "networking"
          mode: "online" | "offline" | "hybrid"
          venue: string | null
          start_date: string
          end_date: string | null
          registration_deadline: string
          max_participants: number | null
          current_participants: number
          entry_fee: number
          prize_pool: number | null
          status: "draft" | "published" | "cancelled" | "completed"
          tags: string[] | null
          requirements: string[] | null
          contact_info: any | null
          image_url: string | null
          team_size: string | null
          duration: string | null
          level: "beginner" | "intermediate" | "advanced" | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          club_id?: string | null
          college: string
          category: string
          type:
            | "workshop"
            | "competition"
            | "seminar"
            | "cultural"
            | "sports"
            | "hackathon"
            | "conference"
            | "networking"
          mode?: "online" | "offline" | "hybrid"
          venue?: string | null
          start_date: string
          end_date?: string | null
          registration_deadline: string
          max_participants?: number | null
          current_participants?: number
          entry_fee?: number
          prize_pool?: number | null
          status?: "draft" | "published" | "cancelled" | "completed"
          tags?: string[] | null
          requirements?: string[] | null
          contact_info?: any | null
          image_url?: string | null
          team_size?: string | null
          duration?: string | null
          level?: "beginner" | "intermediate" | "advanced" | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          club_id?: string | null
          college?: string
          category?: string
          type?:
            | "workshop"
            | "competition"
            | "seminar"
            | "cultural"
            | "sports"
            | "hackathon"
            | "conference"
            | "networking"
          mode?: "online" | "offline" | "hybrid"
          venue?: string | null
          start_date?: string
          end_date?: string | null
          registration_deadline?: string
          max_participants?: number | null
          current_participants?: number
          entry_fee?: number
          prize_pool?: number | null
          status?: "draft" | "published" | "cancelled" | "completed"
          tags?: string[] | null
          requirements?: string[] | null
          contact_info?: any | null
          image_url?: string | null
          team_size?: string | null
          duration?: string | null
          level?: "beginner" | "intermediate" | "advanced" | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      club_memberships: {
        Row: {
          id: string
          user_id: string
          club_id: string
          role: "member" | "admin" | "moderator"
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          role?: "member" | "admin" | "moderator"
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          role?: "member" | "admin" | "moderator"
          joined_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          team_name: string | null
          status: "registered" | "waitlisted" | "cancelled" | "attended"
          registration_data: any | null
          registered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          team_name?: string | null
          status?: "registered" | "waitlisted" | "cancelled" | "attended"
          registration_data?: any | null
          registered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          team_name?: string | null
          status?: "registered" | "waitlisted" | "cancelled" | "attended"
          registration_data?: any | null
          registered_at?: string
        }
      }
    }
  }
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  club?: Club
}
export type ClubMembership = Database["public"]["Tables"]["club_memberships"]["Row"]
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"]
