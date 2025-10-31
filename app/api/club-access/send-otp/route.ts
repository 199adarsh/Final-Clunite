import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabase-admin"

const resend = new Resend(process.env.RESEND_API_KEY)

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { clubId, userId, email } = await request.json()
    if (!clubId || !userId || !email) {
      return NextResponse.json({ error: "clubId, userId and email are required" }, { status: 400 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server not configured for OTP (missing service key)" }, { status: 500 })
    }

    const { data: club, error: clubError } = await supabaseAdmin
      .from("clubs")
      .select("id, name")
      .eq("id", clubId)
      .single()
    if (clubError || !club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    let lastError: any = null
    let code = ""
    for (let i = 0; i < 5; i++) {
      code = generateOtp()
      const { error: insertError } = await supabaseAdmin.from("club_access_otps").insert({
        club_id: clubId,
        sent_to_email: email,
        code,
        user_id: userId,
        expires_at: expiresAt,
        status: "pending",
      })
      if (!insertError) { lastError = null; break }
      lastError = insertError
      if (!/unique/i.test(insertError?.message || "")) break
    }
    if (lastError) return NextResponse.json({ error: `Failed to create OTP: ${lastError.message || lastError}` }, { status: 500 })

    if (!process.env.RESEND_API_KEY) return NextResponse.json({ success: true, message: "OTP generated (email not configured)" })

    const { error: emailError } = await resend.emails.send({
      from: "Clunite <onboarding@resend.dev>",
      to: email,
      subject: `Your OTP to access ${club.name} organizer panel`,
      html: otpTemplate(club.name, code),
    })
    if (emailError) return NextResponse.json({ error: `Failed to send OTP email: ${emailError.message || emailError}` }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

function otpTemplate(clubName: string, code: string) {
  return `<!doctype html><html><body style="font-family: Arial, sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#111827">Organizer Access OTP</h2>
      <p style="margin:0 0 16px;color:#374151">Use this code to access the ${clubName} organizer panel. It expires in 10 minutes.</p>
      <div style="font-weight:700;font-size:28px;letter-spacing:8px;background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;color:#111827">${code}</div>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">If you didn’t request this code, you can ignore this email.</p>
    </div>
  </body></html>`
}


