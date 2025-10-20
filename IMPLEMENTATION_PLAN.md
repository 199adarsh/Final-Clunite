# Complete Implementation Plan - Clunite Authentication & Club Management

## Overview
This plan implements:
- ✅ Full authentication with Supabase Auth
- ✅ Auto-sync auth users with database
- ✅ Multi-use PIN (48 hours, max 5 users)
- ✅ Owner vs Admin hierarchy
- ✅ Fix event creation for multiple admins
- ✅ Invite system for post-PIN additions

---

## Phase 1: Authentication Foundation (Day 1)

### 1.1: Configure Supabase Auth
- Go to Supabase Dashboard → Authentication
- Enable Email provider
- Optional: Enable Google/GitHub OAuth
- Set redirect URL: `http://localhost:3000/auth/callback`

### 1.2: Create Auth Context (`lib/auth-context.tsx`)
- Provides: `{ user, loading, signUp, signIn, signOut }`
- Listens to auth state changes
- Auto-syncs user to database on login

### 1.3: Wrap App (`app/layout.tsx`)
- Import and wrap with `<AuthProvider>`

### 1.4: Create Signup Page (`app/auth/signup/page.tsx`)
- Form: email, password, full_name, college
- On submit: `supabase.auth.signUp()` + create user in database
- Redirect to dashboard

### 1.5: Create Login Page (`app/auth/login/page.tsx`)
- Form: email, password
- On submit: `supabase.auth.signInWithPassword()` + sync user
- Redirect to dashboard

### 1.6: Create Auth Callback (`app/auth/callback/route.ts`)
- Handles OAuth redirects
- Syncs user to database

### 1.7: Add Route Protection (`middleware.ts`)
- Protect `/dashboard/*` routes
- Redirect unauthenticated users to login

---

## Phase 2: Database User Sync (Day 1-2)

### 2.1: Create Sync Utility (`lib/sync-user.ts`)
```typescript
ensureUserExists(authUser, options?)
  → Checks if user exists in users table
  → Creates if missing
  → Returns user record
```

### 2.2: Update Signup to Create DB Record
- After `supabase.auth.signUp()` succeeds
- Insert into `users` table with same ID
- Handle errors gracefully

### 2.3: Update Login to Sync User
- After successful login
- Call `ensureUserExists(user)`
- Fixes missing records silently

### 2.4: Add Auto-Sync to Auth Context
- In `onAuthStateChange` listener
- Call `ensureUserExists()` on SIGNED_IN event

---

## Phase 3: Fix Club Creation (Day 2)

### 3.1: Add Auth Check to Create Club
```typescript
const { user } = useAuth()
if (!user) redirect('/auth/login')
```

### 3.2: Ensure User Exists Before Creating Club
```typescript
await ensureUserExists(user, { college: formData.college })
// Now safe to create club with created_by: user.id
```

### 3.3: Update Database Schema
Run in Supabase SQL Editor:
```sql
ALTER TABLE pending_clubs ADD COLUMN used_count INTEGER DEFAULT 0;
ALTER TABLE pending_clubs ADD COLUMN max_uses INTEGER DEFAULT 5;
ALTER TABLE pending_clubs ADD COLUMN first_used_by UUID REFERENCES users(id);
ALTER TABLE pending_clubs ADD COLUMN first_used_at TIMESTAMP;
ALTER TABLE pending_clubs ADD COLUMN created_by UUID REFERENCES users(id);
```

### 3.4: Store Creator Info in pending_clubs
```typescript
await supabase.from('pending_clubs').insert({
  club_id: club.id,
  pin: clubPIN,
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
  created_by: user.id,
  max_uses: 5,
  used_count: 0
})
```

---

## Phase 4: Multi-Use PIN Verification (Day 2-3)

### 4.1: Update Memberships Schema
```sql
ALTER TABLE club_memberships ADD COLUMN is_owner BOOLEAN DEFAULT false;
ALTER TABLE club_memberships ADD COLUMN verified_via_pin BOOLEAN DEFAULT false;
ALTER TABLE club_memberships ADD COLUMN invited_by UUID REFERENCES users(id);
```

### 4.2: Create Verification Logs Table
```sql
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  user_id UUID NOT NULL REFERENCES users(id),
  pin_used VARCHAR(8),
  verified_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3: Implement Multi-Use PIN Logic
In `verify-club/page.tsx`:
```typescript
1. Validate PIN (check exists, not expired)
2. Check usage limit (used_count < max_uses)
3. Check if user already member
4. Ensure user exists in database
5. Determine if owner (used_count === 0)
6. Add to club_memberships with is_owner flag
7. Increment used_count in pending_clubs
8. Update user role to 'organizer'
9. Log verification
10. Notify owner if not first user
```

### 4.4: Add Verification Status Display
Show: "PIN Usage: 2/5" and expiry time

---

## Phase 5: Fix Event Creation (Day 3)

### 5.1: Add Auth Check to Event Creation
```typescript
const { user } = useAuth()
if (!user) redirect('/auth/login')
```

### 5.2: Ensure User Exists Before Creating Event
```typescript
await ensureUserExists(user)
// Verify user is club admin
const isAdmin = await checkClubAdmin(user.id, clubId)
if (!isAdmin) return error("Not authorized")
// Create event with created_by: user.id
```

### 5.3: Create Permission Utilities (`lib/permissions.ts`)
```typescript
checkClubAdmin(userId, clubId) → boolean
checkClubOwner(userId, clubId) → boolean
getUserClubs(userId) → clubs[]
```

---

## Phase 6: Invite System (Day 4)

### 6.1: Create Invites Table
```sql
CREATE TABLE club_invites (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  invited_email VARCHAR(255),
  invited_by UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'admin',
  status VARCHAR(20) DEFAULT 'pending',
  invite_token VARCHAR(64) UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2: Create Invite API (`app/api/club/invite/route.ts`)
- Verify user is owner
- Generate unique token
- Insert into club_invites
- Send email with accept link

### 6.3: Create Invite Acceptance Page (`app/club/accept-invite/page.tsx`)
- Get token from URL
- Verify token valid
- Ensure user logged in
- Add to club_memberships
- Mark invite accepted

### 6.4: Create Admin Management Page
- List all admins
- Invite button (owner only)
- Remove admin (owner only)
- View pending invites

---

## Phase 7: Notifications (Day 4-5)

### 7.1: Create Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2: Create Notification Utility (`lib/notifications.ts`)
```typescript
notifyUser(userId, { type, title, message, link })
notifyClubAdmins(clubId, notification)
```

### 7.3: Add Notification Triggers
- New admin verified
- Event created
- Invite received

### 7.4: Create Notification Bell Component
- Bell icon with unread count
- Dropdown with recent notifications

---

## Phase 8: Testing (Day 5)

### Test Scenarios
1. **Multiple Admins**: A creates club, B verifies, both create events
2. **PIN Expiry**: Verify PIN expires after 48 hours
3. **Usage Limit**: Verify max 5 users can verify
4. **User Sync**: Verify auto-creation on login
5. **Invite System**: Verify invites work after PIN expires

---

## Phase 9: UI/UX (Day 6)

- Add loading states
- Add success/error toasts
- Add empty states
- Add confirmation dialogs
- Improve error messages

---

## Phase 10: Security (Day 6-7)

- Add rate limiting
- Add input validation
- Review RLS policies
- Add CSRF protection

---

## Implementation Checklist

### Week 1: Authentication
- [ ] Configure Supabase Auth
- [ ] Create Auth Context
- [ ] Create Signup/Login pages
- [ ] Add route protection
- [ ] Create user sync utility
- [ ] Update signup/login to sync users

### Week 2: Club Management
- [ ] Update club creation with auth
- [ ] Add PIN tracking to database
- [ ] Implement multi-use PIN logic
- [ ] Add verification logging

### Week 3: Events & Invites
- [ ] Fix event creation
- [ ] Create permission utilities
- [ ] Build invite system
- [ ] Create admin management page

### Week 4: Polish
- [ ] Add notifications
- [ ] Complete testing
- [ ] UI/UX improvements
- [ ] Security hardening

---

## Key Files to Create

```
lib/
  ├── auth-context.tsx
  ├── sync-user.ts
  ├── permissions.ts
  └── notifications.ts

app/
  ├── auth/
  │   ├── signup/page.tsx
  │   ├── login/page.tsx
  │   └── callback/route.ts
  ├── club/accept-invite/page.tsx
  └── api/club/invite/route.ts

middleware.ts
```

---

## Timeline: 3-4 Weeks

**Week 1:** Auth + User Sync  
**Week 2:** Club + PIN System  
**Week 3:** Events + Invites  
**Week 4:** Testing + Polish

---

## Success Criteria

✅ Users can signup/login  
✅ Every auth user has DB record  
✅ Multiple users can verify with PIN  
✅ All admins can create events  
✅ Invite system works  
✅ No foreign key errors  

Ready to start implementation?
