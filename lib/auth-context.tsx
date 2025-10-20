"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, college: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Ensure user exists in database
  const ensureUserInDatabase = async (authUser: User, additionalData?: { college?: string }) => {
    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single()

      // User exists, no need to create
      if (existingUser && !checkError) {
        console.log('User already exists in database')
        return { success: true }
      }

      // User doesn't exist (PGRST116 = no rows)
      if (checkError && checkError.code === 'PGRST116') {
        console.log('Creating user record in database...')
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || 'unknown@example.com',
            full_name: authUser.user_metadata?.full_name || 
                       authUser.user_metadata?.name ||
                       authUser.email?.split('@')[0] || 
                       'User',
            role: 'student',
            college: additionalData?.college || 
                     authUser.user_metadata?.college || 
                     'Not specified',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: null
          })

        if (insertError) {
          console.error('Failed to create user in database:', insertError)
          return { success: false, error: insertError }
        }

        console.log('User created successfully in database')
        return { success: true }
      }

      // Other error
      console.error('Error checking user:', checkError)
      return { success: false, error: checkError }

    } catch (error) {
      console.error('Error in ensureUserInDatabase:', error)
      return { success: false, error }
    }
  }

  // Sign up new user
  const signUp = async (email: string, password: string, fullName: string, college: string) => {
    try {
      // Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            college: college
          }
        }
      })

      if (signUpError) {
        return { error: signUpError }
      }

      if (data.user) {
        // Create user in database
        const result = await ensureUserInDatabase(data.user, { college })
        
        if (!result.success) {
          return { error: result.error }
        }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { error }
    }
  }

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        return { error: signInError }
      }

      if (data.user) {
        // Ensure user exists in database (non-blocking - don't wait)
        ensureUserInDatabase(data.user).catch(err => {
          console.error('Background user sync failed:', err)
        })
      }

      return { error: null }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Sync user to database if logged in
      if (session?.user) {
        ensureUserInDatabase(session.user)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        setLoading(false)

        // Sync user on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureUserInDatabase(session.user)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
