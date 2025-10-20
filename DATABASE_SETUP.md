# 🗄️ Database Setup for Club Creation Feature

## ⚠️ Important: Run This First!

The "Create Club & Get PIN" feature requires the `pending_clubs` table in your Supabase database. Follow these steps:

---

## 📋 Step-by-Step Setup

### **Step 1: Open Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### **Step 2: Copy and Run This SQL**

Copy the entire SQL below and paste it into the SQL editor:

```sql
-- Create pending_clubs table for club PIN verification
CREATE TABLE IF NOT EXISTS pending_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  pin VARCHAR(8) NOT NULL,
  official_email VARCHAR(255) NOT NULL,
  president_name VARCHAR(255),
  president_email VARCHAR(255),
  president_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_clubs_club_id ON pending_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_pin ON pending_clubs(pin);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_status ON pending_clubs(status);

-- Enable Row Level Security
ALTER TABLE pending_clubs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create pending clubs" ON pending_clubs;
DROP POLICY IF EXISTS "Users can read their pending clubs" ON pending_clubs;
DROP POLICY IF EXISTS "Users can update their pending clubs" ON pending_clubs;

-- Allow authenticated users to insert
CREATE POLICY "Users can create pending clubs"
  ON pending_clubs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own pending clubs
CREATE POLICY "Users can read their pending clubs"
  ON pending_clubs FOR SELECT
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE created_by = auth.uid()
    )
  );

-- Allow users to update their own pending clubs
CREATE POLICY "Users can update their pending clubs"
  ON pending_clubs FOR UPDATE
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE created_by = auth.uid()
    )
  );
```

### **Step 3: Run the Query**

1. Click the **"Run"** button (or press Ctrl+Enter)
2. Wait for "Success. No rows returned"
3. ✅ Done!

---

## 🧪 Verify Setup

Run this query to check if the table was created:

```sql
SELECT * FROM pending_clubs LIMIT 1;
```

You should see the table structure (even if empty).

---

## 🔍 Troubleshooting

### **Error: "relation 'clubs' does not exist"**

The `clubs` table must exist first. Make sure your main database is set up.

### **Error: "permission denied"**

Make sure you're running the query as the database owner or have proper permissions.

### **Error: "policy already exists"**

The DROP POLICY statements in the SQL above will handle this. Just run it again.

---

## ✅ After Setup

Once the table is created, you can:

1. Go to `/dashboard/organizer/host/verify`
2. Click "Create New Club"
3. Fill the form
4. Click "Create Club & Get PIN"
5. Check browser console for the 8-digit PIN
6. Use the PIN to verify your club

---

## 📊 Table Structure

The `pending_clubs` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to clubs table |
| `pin` | VARCHAR(8) | 8-digit verification PIN |
| `official_email` | VARCHAR(255) | Club email |
| `president_name` | VARCHAR(255) | President name |
| `president_email` | VARCHAR(255) | President email |
| `president_phone` | VARCHAR(50) | President phone |
| `status` | VARCHAR(20) | pending/verified/expired |
| `expires_at` | TIMESTAMP | PIN expiration (7 days) |
| `verified_at` | TIMESTAMP | Verification timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Update timestamp |

---

## 🔐 Security (RLS Policies)

The table has Row Level Security enabled with these policies:

1. **Insert**: Any authenticated user can create pending clubs
2. **Select**: Users can only read their own pending clubs
3. **Update**: Users can only update their own pending clubs

---

## 🚀 Quick Test

After setup, test with this query:

```sql
-- This should work without errors
INSERT INTO pending_clubs (
  club_id, 
  pin, 
  official_email, 
  expires_at
) VALUES (
  (SELECT id FROM clubs LIMIT 1),
  '12345678',
  'test@example.com',
  NOW() + INTERVAL '7 days'
);

-- Check if it was inserted
SELECT * FROM pending_clubs ORDER BY created_at DESC LIMIT 1;

-- Clean up test data
DELETE FROM pending_clubs WHERE pin = '12345678';
```

---

## 📝 Notes

- PINs expire after 7 days
- Each club can have multiple pending PINs (for retry scenarios)
- Verified PINs are kept for audit purposes
- The table uses CASCADE delete (if club is deleted, pending entries are too)

---

## ✨ You're All Set!

After running the SQL, the "Create Club & Get PIN" feature will work perfectly! 🎉

If you still have issues, check:
1. ✅ SQL ran successfully
2. ✅ No errors in browser console
3. ✅ User is authenticated
4. ✅ Clubs table exists
