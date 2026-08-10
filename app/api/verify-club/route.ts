import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { pendingClubId, pin, userId, bannerUrl } = await request.json();

    console.log('API: Verifying and creating club with RPC:', {
      pendingClubId,
      pin,
      userId,
      bannerUrl: bannerUrl ? 'provided' : 'none',
    });

    if (!pendingClubId || !pin || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: pendingClubId, pin, and userId are required.' },
        { status: 400 }
      );
    }

    // Call the PostgreSQL atomic function via RPC
    const { data, error } = await supabaseAdmin.rpc('verify_and_create_club', {
      p_pending_club_id: pendingClubId,
      p_user_id: userId,
      p_banner_url: bannerUrl || null,
      p_pin: pin,
    });

    if (error) {
      console.error('API: RPC Error executing verify_and_create_club:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to verify and create club.' },
        { status: 400 }
      );
    }

    console.log('API: RPC success, created club:', data);

    return NextResponse.json({
      success: true,
      club: data,
    });
  } catch (error: any) {
    console.error('API: Unexpected Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
