import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, clubName, pin } = body

    // Validate required fields
    if (!email || !clubName || !pin) {
      console.error('Missing required fields:', { email: !!email, clubName: !!clubName, pin: !!pin })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, clubName, or pin' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate PIN format (8 digits)
    if (!/^\d{8}$/.test(pin)) {
      console.error('Invalid PIN format:', pin)
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 8 digits' },
        { status: 400 }
      )
    }

    // Log PIN for debugging
    console.log(`
      ========================================
      CLUB VERIFICATION PIN
      ========================================
      Club: ${clubName}
      Email: ${email}
      PIN: ${pin}
      Timestamp: ${new Date().toISOString()}
      ========================================
    `)

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.')
      return NextResponse.json({ 
        success: true, 
        message: 'PIN logged (email service not configured)' 
      })
    }

    // Send email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'Clunite <onboarding@resend.dev>', // Use your verified domain in production
        to: email,
        subject: `Your Club Verification PIN - ${clubName}`,
        html: emailTemplate(clubName, pin)
      })

      if (error) {
        console.error('Resend error:', error)
        return NextResponse.json(
          { success: false, error: `Email service error: ${error.message}` },
          { status: 500 }
        )
      }

      console.log('Email sent successfully to:', email, 'ID:', data?.id)
      return NextResponse.json({ 
        success: true, 
        message: 'PIN sent successfully via email' 
      })
    } catch (emailError: any) {
      console.error('Email service error:', emailError)
      return NextResponse.json(
        { success: false, error: `Email service error: ${emailError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending PIN:', error)
    const errorMessage = error.message || error.toString() || 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to send PIN: ${errorMessage}` },
      { status: 500 }
    )
  }
}

function emailTemplate(clubName: string, pin: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .pin-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .pin { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Club Verification PIN</h1>
        </div>
        <div class="content">
          <h2>Welcome to Clunite!</h2>
          <p>Your club <strong>${clubName}</strong> has been successfully created.</p>
          <p>Use the PIN below to verify your club and gain organizer access:</p>
          
          <div class="pin-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your 8-Digit PIN</p>
            <div class="pin">${pin}</div>
          </p>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Go to the club verification page</li>
            <li>Enter this 8-digit PIN</li>
            <li>Get instant organizer access</li>
          </ol>
          
          <p style="color: #e74c3c;"><strong>Important:</strong> This PIN expires in 48 hours and can be used by up to 5 people.</p>
          
          <p>If you didn't create this club, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Clunite - Campus Event Management</p>
          <p>Unite • Create • Celebrate</p>
        </div>
      </div>
    </body>
    </html>
  `
}
