# Project Structure

## Overview

Clunite follows Next.js 14 App Router conventions with a clear separation of concerns.

## Directory Structure

```
clunite/
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── pull_request_template.md
│   └── FUNDING.yml
├── .vscode/                    # VSCode settings
│   ├── settings.json
│   └── extensions.json
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   ├── dashboard/              # Dashboard pages
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   └── [feature-components]
├── docs/                       # Documentation
│   ├── SETUP.md
│   ├── DATABASE.md
│   ├── API.md
│   └── DEPLOYMENT.md
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities
│   ├── supabase.ts
│   └── utils.ts
├── public/                     # Static assets
├── scripts/                    # Database scripts
│   ├── init-database-v2.sql
│   ├── functions.sql
│   ├── rls-policies.sql
│   └── seed-data-v2.sql
├── styles/                     # Additional styles
└── [config files]              # Various config files
```

## Key Files

### Configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration
- `.prettierrc` - Code formatting rules
- `.eslintrc.json` - Linting rules

### Environment
- `.env.local` - Local environment variables (gitignored)
- `.env.example` - Environment template

### Documentation
- `README.md` - Main documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history
- `LICENSE` - MIT license
- `SECURITY.md` - Security policy
- `CODE_OF_CONDUCT.md` - Code of conduct

## Component Organization

### UI Components (`components/ui/`)
Reusable shadcn/ui components:
- Buttons, inputs, dialogs
- Cards, badges, avatars
- Navigation, dropdowns
- Forms, tables

### Feature Components (`components/`)
Application-specific components:
- `app-sidebar.tsx` - Navigation sidebar
- `dashboard-header.tsx` - Dashboard header
- Event cards, club cards
- Registration forms

## Routing Structure

### Public Routes
- `/` - Landing page
- `/login` - Authentication

### Protected Routes
- `/dashboard/student/*` - Student dashboard
- `/dashboard/organizer/*` - Organizer dashboard

## Data Flow

1. **Client** → React components
2. **Hooks** → Custom data fetching
3. **Supabase Client** → Database queries
4. **Database** → PostgreSQL via Supabase

## Styling Approach

- **Tailwind CSS** for utility classes
- **shadcn/ui** for component primitives
- **CSS Modules** for component-specific styles
- **Global styles** in `app/globals.css`

## State Management

- **React Hooks** for local state
- **Supabase Realtime** for live updates
- **Server Components** for data fetching
- **Client Components** for interactivity
