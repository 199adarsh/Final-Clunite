import { createBrowserClient } from "@supabase/ssr"
import { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton client for browser
let client: SupabaseClient<Database> | null = null

export const supabase: SupabaseClient<Database> = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create new client each time
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: reuse singleton
  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
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
          branch: string | null
          gender: string | null
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
          branch?: string | null
          gender?: string | null
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
          branch?: string | null
          gender?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          created_at: string
          updated_at: string
          views: number
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
          views?: number
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
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      club_memberships: {
        Row: {
          id: string
          user_id: string
          club_id: string
          role: "member" | "admin" | "moderator"
          joined_at: string
          is_owner: boolean
          verified_via_pin: boolean
          invited_by: string | null
          invited_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          role?: "member" | "admin" | "moderator"
          joined_at?: string
          is_owner?: boolean
          verified_via_pin?: boolean
          invited_by?: string | null
          invited_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          role?: "member" | "admin" | "moderator"
          joined_at?: string
          is_owner?: boolean
          verified_via_pin?: boolean
          invited_by?: string | null
          invited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_expenses: {
        Row: {
          id: string
          event_id: string
          category: string
          amount: number
          vendor: string | null
          payment_method: string | null
          incurred_at: string
          notes: string | null
          type: "income" | "expense"
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          category: string
          amount: number
          vendor?: string | null
          payment_method?: string | null
          incurred_at?: string
          notes?: string | null
          type?: "income" | "expense"
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          category?: string
          amount?: number
          vendor?: string | null
          payment_method?: string | null
          incurred_at?: string
          notes?: string | null
          type?: "income" | "expense"
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      club_access_otps: {
        Row: {
          id: string
          club_id: string
          user_id: string
          code: string
          sent_to_email: string
          expires_at: string
          status: "pending" | "used" | "expired"
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          code: string
          sent_to_email: string
          expires_at: string
          status?: "pending" | "used" | "expired"
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          code?: string
          sent_to_email?: string
          expires_at?: string
          status?: "pending" | "used" | "expired"
          used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      pending_clubs_public: {
        Row: {
          id: string
          status: "pending" | "verified" | "expired"
          expires_at: string
          created_by: string | null
          created_at: string
          club_data: any | null
          official_email: string
        }
        Insert: {
          id?: string
          status?: "pending" | "verified" | "expired"
          expires_at: string
          created_by?: string | null
          created_at?: string
          club_data?: any | null
          official_email: string
        }
        Update: {
          id?: string
          status?: "pending" | "verified" | "expired"
          expires_at?: string
          created_by?: string | null
          created_at?: string
          club_data?: any | null
          official_email?: string
        }
        Relationships: []
      }
      pending_clubs: {
        Row: {
          id: string
          status: "pending" | "verified" | "expired"
          expires_at: string
          created_by: string | null
          created_at: string
          club_data: any | null
          official_email: string
          pin: string
        }
        Insert: {
          id?: string
          status?: "pending" | "verified" | "expired"
          expires_at: string
          created_by?: string | null
          created_at?: string
          club_data?: any | null
          official_email: string
          pin: string
        }
        Update: {
          id?: string
          status?: "pending" | "verified" | "expired"
          expires_at?: string
          created_by?: string | null
          created_at?: string
          club_data?: any | null
          official_email?: string
          pin?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_for_event: {
        Args: {
          p_event_id: string
          p_user_id: string
          p_team_name: string | null
          p_registration_data: any
          p_participant_count: number
        }
        Returns: any
      }
      verify_and_create_club: {
        Args: {
          p_pending_club_id: string
          p_user_id: string
          p_banner_url: string | null
          p_pin: string
        }
        Returns: any
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  club?: Club | null
}
export type ClubMembership = Database["public"]["Tables"]["club_memberships"]["Row"]
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"]
export type EventExpense = Database["public"]["Tables"]["event_expenses"]["Row"]
export type ClubAccessOtp = Database["public"]["Tables"]["club_access_otps"]["Row"]

