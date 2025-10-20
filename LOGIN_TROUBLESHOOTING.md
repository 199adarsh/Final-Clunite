# Login Troubleshooting Guide

## Issue: Login Stuck on "Logging in..."

### Fixes Applied:

1. ✅ **Made user sync non-blocking** - Login no longer waits for database sync
2. ✅ **Added better error logging** - Check browser console for errors
3. ✅ **Added small delay** - Ensures auth state updates before redirect

### How to Debug:

#### Step 1: Open Browser Console
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Try logging in again
4. Look for error messages

#### Step 2: Check for Common Errors

**Error: "Failed to create user in database"**
- **Cause:** `users` table doesn't exist or has wrong schema
- **Fix:** Run the database initialization script

**Error: "Permission denied" or "RLS"**
- **Cause:** Row Level Security is blocking inserts
- **Fix:** Run `scripts/rls-policies.sql` in Supabase SQL Editor

**Error: "Invalid login credentials"**
- **Cause:** Wrong email/password or user doesn't exist
- **Fix:** Try signing up first, then login

**Error: Network error or timeout**
- **Cause:** Supabase connection issue
- **Fix:** Check `.env.local` has correct Supabase URL and key

#### Step 3: Verify Supabase Setup

Check your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Step 4: Check Database Tables

Go to Supabase Dashboard → Table Editor and verify:

1. **`users` table exists** with columns:
   - `id` (UUID, primary key)
   - `email` (text)
   - `full_name` (text)
   - `role` (text)
   - `college` (text)
   - `avatar_url` (text, nullable)
   - `bio` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **RLS is DISABLED** on `users` table (for development)

#### Step 5: Test Signup First

If login doesn't work, try signup:
1. Go to `/auth/signup`
2. Create a new account
3. Check console for errors
4. If signup works, try login with those credentials

### Quick Fixes:

#### Fix 1: Disable RLS (Development Only)
Run this in Supabase SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

#### Fix 2: Create Users Table
If table doesn't exist, run:
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  college VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

#### Fix 3: Clear Browser Cache
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear site data in DevTools → Application → Clear storage

#### Fix 4: Check Network Tab
1. Open DevTools → Network tab
2. Try logging in
3. Look for failed requests (red)
4. Click on failed request to see error details

### Expected Console Output (Success):

```
Login successful, redirecting...
✅ User exists in database
```

OR

```
Login successful, redirecting...
⚠️  User not found in database, creating user record for: user@example.com
✅ User created successfully in database
```

### Expected Console Output (Error):

```
Login error: {message: "Invalid login credentials"}
```

OR

```
❌ Failed to create user in database: {code: "42501", message: "permission denied"}
```

---

## Still Not Working?

### Try This Minimal Test:

1. **Test Supabase Connection:**
   - Open browser console
   - Type: `localStorage.getItem('supabase.auth.token')`
   - Should return `null` if not logged in

2. **Test Direct Supabase Auth:**
   ```javascript
   // In browser console
   const { createClient } = supabase
   const client = createClient(
     'YOUR_SUPABASE_URL',
     'YOUR_ANON_KEY'
   )
   
   // Try login
   const { data, error } = await client.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'password123'
   })
   
   console.log('Data:', data)
   console.log('Error:', error)
   ```

3. **Check if user was created:**
   - Go to Supabase Dashboard → Authentication → Users
   - See if your email is listed
   - If yes, user exists in auth but maybe not in database

---

## Manual Workaround (Temporary):

If login still doesn't work, you can temporarily bypass the database sync:

1. Comment out the user sync in `lib/auth-context.tsx`:
   ```typescript
   // if (data.user) {
   //   ensureUserInDatabase(data.user).catch(err => {
   //     console.error('Background user sync failed:', err)
   //   })
   // }
   ```

2. This will let you login without creating database record
3. You can manually create the user record later

---

## Contact Points:

If none of this works, share:
1. Browser console errors (screenshot)
2. Network tab errors (screenshot)
3. Supabase table structure (screenshot)
4. `.env.local` values (hide the actual keys, just show format)
