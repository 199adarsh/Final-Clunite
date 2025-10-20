# 🚀 Quick Start - Club Creation Feature

## Setup (5 Minutes)

### 1. Run Database Migration

Open your Supabase SQL Editor and run:

```sql
-- Copy and paste the entire content from:
-- supabase/migrations/create_pending_clubs.sql
```

Or run this directly:

```sql
CREATE TABLE IF NOT EXISTS pending_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  pin VARCHAR(8) NOT NULL,
  official_email VARCHAR(255) NOT NULL,
  president_name VARCHAR(255),
  president_email VARCHAR(255),
  president_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_clubs_club_id ON pending_clubs(club_id);
CREATE INDEX idx_pending_clubs_pin ON pending_clubs(pin);
CREATE INDEX idx_pending_clubs_status ON pending_clubs(status);

ALTER TABLE pending_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create pending clubs"
  ON pending_clubs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can read their pending clubs"
  ON pending_clubs FOR SELECT TO authenticated
  USING (club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid()));

CREATE POLICY "Users can update their pending clubs"
  ON pending_clubs FOR UPDATE TO authenticated
  USING (club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid()));
```

### 2. Start the App

```bash
pnpm run dev
```

### 3. Test It!

1. Go to: `http://localhost:3000/dashboard/organizer`
2. Click **"Create Club"** button
3. Fill the form
4. Submit
5. Check console for PIN (or email if configured)
6. Enter PIN on verification page
7. Done! You now have organizer access 🎉

---

## 📧 Enable Email (Optional)

### Quick Setup with Resend:

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Get API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Get your API key

3. **Add to `.env.local`:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Update `/app/api/send-club-pin/route.ts`:**

   Replace the entire file with:

   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function POST(request: NextRequest) {
     try {
       const { email, clubName, pin } = await request.json()

       await resend.emails.send({
         from: 'Clunite <onboarding@resend.dev>',
         to: email,
         subject: `Your Club Verification PIN - ${clubName}`,
         html: emailTemplate(clubName, pin)
       })

       return NextResponse.json({ success: true })
     } catch (error) {
       console.error('Error:', error)
       return NextResponse.json({ success: false }, { status: 500 })
     }
   }

   function emailTemplate(clubName: string, pin: string) {
     return `
       <!DOCTYPE html>
       <html>
       <head>
         <style>
           body { font-family: Arial, sans-serif; }
           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
           .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px; }
           .pin-box { background: #f8f9fa; border: 2px dashed #667eea; 
                     padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
           .pin { font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                 color: #667eea; font-family: monospace; }
         </style>
       </head>
       <body>
         <div class="container">
           <div class="header">
             <h1>🎉 Club Verification PIN</h1>
           </div>
           <div style="padding: 30px; background: white; border: 1px solid #ddd;">
             <h2>Welcome to Clunite!</h2>
             <p>Your club <strong>${clubName}</strong> has been created.</p>
             <p>Use this PIN to verify your club:</p>
             <div class="pin-box">
               <p style="margin: 0; font-size: 14px; color: #666;">Your 8-Digit PIN</p>
               <div class="pin">${pin}</div>
             </div>
             <p><strong>Next Steps:</strong></p>
             <ol>
               <li>Go to the verification page</li>
               <li>Enter this PIN</li>
               <li>Get organizer access!</li>
             </ol>
             <p style="color: #e74c3c;"><strong>Important:</strong> PIN expires in 7 days.</p>
           </div>
         </div>
       </body>
       </html>
     `
   }
   ```

5. **Restart app and test!**

---

## 🎯 Usage

### For Users:

**Step 1:** Click "Create Club" in organizer dashboard

**Step 2:** Fill form:
- Club Name *
- Category *
- College *
- Official Email * (PIN sent here)
- Other details

**Step 3:** Submit → Receive PIN

**Step 4:** Enter PIN → Get Access!

---

## 🐛 Troubleshooting

**PIN not showing?**
- Check browser console (F12)
- PIN is logged there if email not configured

**Verification failed?**
- Check PIN is exactly 8 digits
- Make sure it hasn't expired (7 days)
- Try creating a new club

**No organizer access?**
- Check user role in database
- Verify club is marked as verified
- Reload the page

---

## 📚 Documentation

- **Full Guide:** See `CLUB_CREATION_GUIDE.md`
- **Implementation:** See `IMPLEMENTATION_SUMMARY.md`
- **Main README:** See `README.md`

---

## ✅ That's It!

You're ready to create clubs with PIN verification! 🎉

For questions or issues, check the documentation files.
