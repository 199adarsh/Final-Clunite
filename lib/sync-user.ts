/**
 * User Sync Utility
 * Ensures authenticated users exist in the database
 * Prevents foreign key constraint violations
 */

import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

interface EnsureUserOptions {
  college?: string
  role?: 'student' | 'organizer' | 'admin'
}

/**
 * Ensures the authenticated user exists in the users table
 * Creates them if they don't exist
 * 
 * @param authUser - The Supabase auth user object
 * @param options - Optional college and role
 * @returns Success status and user data
 */
export async function ensureUserExists(
  authUser: User,
  options?: EnsureUserOptions
): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    // Check if user exists in database
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name, role, college')
      .eq('id', authUser.id)
      .single()

    // User exists, return it
    if (existingUser && !checkError) {
      console.log('✅ User exists in database:', existingUser.email)
      return { success: true, data: existingUser }
    }

    // User doesn't exist (PGRST116 = no rows returned)
    if (checkError && checkError.code === 'PGRST116') {
      console.log('⚠️  User not found in database, creating user record for:', authUser.email)
      
      // Create user record
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || 'unknown@example.com',
          full_name: authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name ||
                     authUser.email?.split('@')[0] || 
                     'User',
          role: options?.role || 'student',
          college: options?.college || 
                   authUser.user_metadata?.college || 
                   'Not specified',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          bio: null
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to create user record:', insertError)
        return { success: false, error: insertError }
      }

      console.log('✅ User record created successfully:', newUser.id)
      return { success: true, data: newUser }
    }

    // Other database error
    console.error('❌ Error checking user existence:', checkError)
    return { success: false, error: checkError }

  } catch (error: any) {
    console.error('❌ Error in ensureUserExists:', error)
    return { success: false, error }
  }
}

/**
 * Quick check if user exists in database
 * Returns boolean without creating user
 */
export async function userExistsInDatabase(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

/**
 * Get user from database by ID
 */
export async function getUserFromDatabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserFromDatabase:', error)
    return null
  }
}
