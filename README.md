## 🎓 Clunite — Campus Event & Club Management

Clunite helps students discover events and clubs, and enables organizers to host and manage them—efficiently and at scale. This repository contains a single Next.js 14 application powered by Supabase, Tailwind CSS, and shadcn/ui.

### 🌟 Highlights
- Student and Organizer dashboards under `app/dashboard/*`
- Discover events, join clubs, register, and manage hosting
- Typed Supabase client for users, clubs, events, memberships, and registrations
- Image uploads via Vercel Blob (`POST /api/upload`)

## 🧰 Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Database:** Supabase (PostgreSQL + client)
- **Hosting:** Vercel + Vercel Analytics

## 📁 Project Structure
```
.
├─ app/
│  ├─ api/
│  │  └─ upload/route.ts           # Image upload to Vercel Blob
│  ├─ dashboard/
│  │  ├─ layout.tsx
│  │  ├─ organizer/
│  │  │  ├─ host/ (create/verify)
│  │  │  └─ analytics/
│  │  └─ student/
│  │     ├─ browse/
│  │     ├─ events/[id]/
│  │     └─ my-clubs/
│  ├─ globals.css
│  ├─ layout.tsx                    # Root layout
│  └─ page.tsx                      # Landing page
├─ components/
│  ├─ app-sidebar.tsx
│  ├─ dashboard-header.tsx
│  └─ ui/*                          # shadcn/ui components
├─ hooks/
│  ├─ useClubs.ts                   # clubs + memberships helpers
│  └─ useEvents.ts                  # events querying helpers
├─ lib/
│  ├─ supabase.ts                   # supabase client + typed models
│  └─ utils.ts                      # `cn` tailwind class merge
├─ public/                          # static assets
├─ tailwind.config.ts
├─ next.config.mjs
├─ tsconfig.json
└─ package.json
```

## ✨ Features
- 🧑‍🎓 Student: discover events, view details, join clubs, track registrations
- 🧑‍💼 Organizer: verify as host, create events, view analytics pages, **create clubs with PIN verification**
- 🧩 Shared: responsive UI, theming, and prebuilt components (shadcn/ui)
- 🏢 Club Creation: Detailed registration form with 8-digit PIN verification via email

## 🧱 Requirements
- Node.js 18+
- Supabase project (URL + anon key)
- Vercel Blob token (for image uploads)

## 🚀 Setup
1) Install dependencies
```bash
npm install
# or
pnpm install
```

2) Configure environment variables (e.g. `.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

3) Run the dev server
```bash
npm run dev
# or
pnpm dev
```
Open http://localhost:3000

## 📜 Scripts
- `dev`: start Next dev server
- `build`: production build
- `start`: start production server
- `lint`: run ESLint

## 🔌 API
- `POST /api/upload`: multipart/form-data with `file` (image), returns `{ url }`
- `POST /api/send-club-pin`: Send 8-digit PIN to club email for verification

## 🗄️ Data Model (from `lib/supabase.ts`)
- `users`: id, email, full_name, role, college, avatar_url, bio
- `clubs`: id, name, category, college, media, counts, verification, metadata
- `pending_clubs`: club_id, pin, official_email, status, expires_at (for PIN verification)
- `events`: id, title, description, club_id, dates, status, tags, image_url, etc.
- `club_memberships`: user_id, club_id, role
- `event_registrations`: user_id, event_id, status, team_name

## 🚢 Deployment
- Deploy on Vercel. Set env vars there:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `BLOB_READ_WRITE_TOKEN`
- Images are uploaded to Vercel Blob via the API route.

## 📝 Notes
- `next.config.mjs` ignores TypeScript/ESLint build errors and uses unoptimized images for easier local/dev workflows.
- Tailwind is configured for `app`, `components`, and `pages` directories; shadcn/ui tokens in `components.json`.

## 📄 License
MIT
