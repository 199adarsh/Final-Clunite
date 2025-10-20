# Email Service Setup (Resend)

## ✅ What's Done:
- Resend package installed
- Email API route created and configured
- Email template with PIN ready
- Graceful fallback if no API key

## 🚀 How to Enable Emails:

### Step 1: Sign Up for Resend (FREE)
1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address
4. **Free tier:** 3,000 emails/month, 100 emails/day

### Step 2: Get Your API Key
1. Go to Resend Dashboard
2. Click "API Keys" in sidebar
3. Click "Create API Key"
4. Name it: "Clunite Development"
5. Copy the API key (starts with `re_`)

### Step 3: Add to Environment Variables
1. Open `.env.local` file
2. Add this line:
```env
RESEND_API_KEY=re_your_api_key_here
```
3. Save the file

### Step 4: Restart Dev Server
```bash
# Stop server (Ctrl+C)
pnpm run dev
```

### Step 5: Test It!
1. Create a new club
2. Check the email inbox
3. You should receive a beautiful email with the PIN!

---

## 📧 Email Features:

### What Gets Sent:
- **Subject:** "Your Club Verification PIN - [Club Name]"
- **From:** Clunite <onboarding@resend.dev>
- **Beautiful HTML template** with:
  - Club name
  - 8-digit PIN in large font
  - Step-by-step instructions
  - 48-hour expiry notice
  - Multi-use info (up to 5 people)

### Email Template Preview:
```
🎉 Club Verification PIN

Welcome to Clunite!
Your club [Club Name] has been successfully created.

Your 8-Digit PIN:
12345678

Next Steps:
1. Go to the club verification page
2. Enter this 8-digit PIN
3. Get instant organizer access

⚠️ Important: This PIN expires in 48 hours and can be used by up to 5 people.
```

---

## 🔧 Current Behavior:

### Without API Key:
- ✅ Club creation works
- ✅ PIN shown on screen (15 seconds)
- ✅ PIN logged in console
- ⚠️ Email not sent (graceful fallback)

### With API Key:
- ✅ Club creation works
- ✅ PIN shown on screen (15 seconds)
- ✅ PIN logged in console
- ✅ **Email sent to official club email**
- ✅ Beautiful HTML email template

---

## 🎯 For Production:

### Use Your Own Domain:
1. Add your domain in Resend dashboard
2. Add DNS records (Resend provides them)
3. Update the "from" address in code:
```typescript
from: 'Clunite <noreply@yourdomain.com>'
```

### Current (Development):
```typescript
from: 'Clunite <onboarding@resend.dev>'
```

This uses Resend's test domain - works for testing!

---

## 📊 Monitoring:

### Check Email Status:
1. Go to Resend Dashboard
2. Click "Emails" in sidebar
3. See all sent emails with status:
   - ✅ Delivered
   - ⏳ Queued
   - ❌ Failed

### Logs:
- Check browser console for email send status
- Check terminal for API logs

---

## 🐛 Troubleshooting:

### Email Not Sending?
1. **Check API key is set:**
   ```bash
   # In terminal
   echo $RESEND_API_KEY
   ```

2. **Check .env.local:**
   ```env
   RESEND_API_KEY=re_xxxxx
   ```

3. **Restart dev server** after adding key

4. **Check console logs:**
   - Should see: "Email sent successfully to: [email]"
   - If error: Check API key is valid

### Email in Spam?
- Normal for test emails
- Check spam/junk folder
- In production with verified domain, this won't happen

---

## 💰 Pricing:

### Free Tier (Perfect for Development):
- 3,000 emails/month
- 100 emails/day
- All features included
- No credit card required

### Paid Plans (If Needed Later):
- $20/month: 50,000 emails
- $80/month: 100,000 emails
- Custom: More than 100k

---

## ✅ Summary:

**For Now (Testing):**
- Email service is optional
- PIN shows on screen - that's enough!
- Everything works without email

**For Production:**
- Add Resend API key (5 minutes)
- Emails will be sent automatically
- Beautiful HTML template ready
- Free tier is plenty for most use cases

**Next Steps:**
1. Test club creation without email (works now!)
2. Add Resend API key when ready
3. Test with real emails
4. Deploy to production

---

## 🎉 You're All Set!

The email system is fully implemented and ready. Just add the API key when you want emails to actually send!
