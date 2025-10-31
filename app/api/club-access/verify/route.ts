import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const { clubId, userId, code } = await request.json()
    if (!clubId || !userId || !code) return NextResponse.json({ error: "clubId, userId and code are required" }, { status: 400 })
    if (!supabaseAdmin) return NextResponse.json({ error: "Server not configured for OTP (missing service key)" }, { status: 500 })

    const { data: otp, error: fetchError } = await supabaseAdmin
      .from("club_access_otps")
      .select("id, status, expires_at")
      .eq("club_id", clubId)
      .eq("code", code)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otp) return NextResponse.json({ error: fetchError?.message || "Invalid or already used code" }, { status: 400 })

    if (new Date(otp.expires_at) < new Date()) {
      await supabaseAdmin.from("club_access_otps").update({ status: "expired" }).eq("id", otp.id)
      return NextResponse.json({ error: "Code expired" }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("club_access_otps")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", otp.id)
    if (updateError) return NextResponse.json({ error: updateError.message || "Failed to mark OTP used" }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}


