import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

// Server-side Supabase client — runs on the server so no browser/CORS issues
// Uses anon key since RLS is not enabled on issued_certificates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Prefer service role key if available, fallback to anon key
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('issued_certificates')
      .select('id, certificate_code, issued_at, event_id, event_title, club_name, recipient_name, template_url, template_config')
      .or(`user_id.eq.${userId},recipient_email.eq.${email}`)
      .order('issued_at', { ascending: false })

    if (error) {
      console.error('Certificates fetch error:', error)
      return NextResponse.json({ error: error.message, data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    console.error('Certificates API error:', err)
    return NextResponse.json({ error: err.message, data: [] }, { status: 200 })
  }
}
