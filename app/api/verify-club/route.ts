import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { clubEmail, pin, userId } = await request.json()

    console.log('API: Verifying club with:', { clubEmail, pin, userId })

    // Query pending_clubs using service role (bypasses RLS)
    const { data: pendingClub, error } = await supabaseAdmin
      .from('pending_clubs')
      .select('*')
      .eq('official_email', clubEmail)
      .eq('pin', pin)
      .maybeSingle()

    console.log('API: Query result:', { pendingClub, error })

    if (error) {
      console.error('API: Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    if (!pendingClub) {
      // Try to find clubs with this email to help debug
      const { data: clubsByEmail } = await supabaseAdmin
        .from('pending_clubs')
        .select('official_email, pin, status, created_at')
        .eq('official_email', clubEmail)
        .order('created_at', { ascending: false })

      console.log('API: Clubs with this email:', clubsByEmail)

      return NextResponse.json(
        { 
          error: 'Club not found',
          debug: {
            searchedEmail: clubEmail,
            searchedPin: pin,
            clubsWithEmail: clubsByEmail
          }
        },
        { status: 404 }
      )
    }

    // Check if PIN expired
    if (new Date(pendingClub.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'PIN has expired (48 hours)' },
        { status: 400 }
      )
    }

    // Return the pending club data
    return NextResponse.json({
      success: true,
      pendingClub
    })

  } catch (error: any) {
    console.error('API: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
