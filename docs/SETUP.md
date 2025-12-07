# Setup Guide

## Prerequisites

- Node.js 18.x or higher
- npm, pnpm, or yarn
- Supabase account
- Vercel account (for Blob storage)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/clunite.git
cd clunite
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key
4. Run the database scripts in order:
   - `scripts/init-database-v2.sql`
   - `scripts/functions.sql`
   - `scripts/rls-policies.sql`
   - `scripts/seed-data-v2.sql` (optional)

### 3. Vercel Blob Setup

1. Create a Vercel account
2. Create a new Blob store
3. Copy the read/write token

### 4. Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Verify your domain (optional)

### 5. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
BLOB_READ_WRITE_TOKEN=your_token
RESEND_API_KEY=your_resend_key
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Troubleshooting

- **Database errors**: Check RLS policies are enabled
- **Auth errors**: Verify Supabase keys
- **Upload errors**: Check Blob token permissions
