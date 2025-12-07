<div align="center">

# 🎓 Clunite

**Campus Event & Club Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Clunite** is a comprehensive campus event and club management platform that bridges the gap between students and campus organizations. Built with modern web technologies, it provides an intuitive interface for students to discover events and clubs while empowering organizers with powerful management tools.

### 🎯 Key Highlights

- **Dual Dashboard System**: Separate interfaces for students and organizers
- **Real-time Updates**: Live event and club information powered by Supabase
- **Secure Authentication**: Email-based verification with PIN system for club creation
- **Modern UI/UX**: Beautiful, responsive design using shadcn/ui components
- **Analytics Dashboard**: Comprehensive insights for event organizers
- **Image Management**: Seamless image uploads via Vercel Blob

---

## ✨ Features

### For Students 🧑‍🎓

- **Event Discovery**: Browse and filter campus events by category, date, and club
- **Club Exploration**: Discover clubs aligned with your interests
- **Easy Registration**: One-click event registration with team support
- **Personal Dashboard**: Track your registrations and club memberships
- **Event Details**: Comprehensive event information with images and descriptions

### For Organizers 🧑‍💼

- **Club Management**: Create and manage clubs with official email verification
- **Event Creation**: Host events with rich details, images, and registration tracking
- **Analytics**: View registration statistics and engagement metrics
- **Member Management**: Manage club memberships and roles
- **Verification System**: Secure 8-digit PIN verification for club authenticity

### Technical Features 🛠️

- **Type-Safe**: Full TypeScript support with typed Supabase client
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Server Components**: Optimized performance with Next.js 14 App Router
- **Form Validation**: Robust form handling with React Hook Form and Zod
- **Real-time Data**: Live updates using Supabase subscriptions
- **SEO Optimized**: Meta tags and structured data for better discoverability

---

## 🧰 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Next.js API Routes, Supabase |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth |
| **Storage** | Vercel Blob |
| **Deployment** | Vercel |
| **Analytics** | Vercel Analytics |
| **Form Handling** | React Hook Form, Zod |
| **Email** | Resend |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** / **pnpm** / **yarn**
- **Supabase** account and project
- **Vercel** account (for deployment and Blob storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/clunite.git
   cd clunite
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL editor:
   ```bash
   # In order:
   scripts/init-database-v2.sql
   scripts/functions.sql
   scripts/rls-policies.sql
   scripts/seed-data-v2.sql  # Optional: for demo data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
clunite/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes
│   │   ├── upload/               # Image upload endpoint
│   │   └── send-club-pin/        # PIN verification email
│   ├── dashboard/                # Dashboard layouts
│   │   ├── organizer/            # Organizer dashboard
│   │   │   ├── host/             # Event hosting
│   │   │   └── analytics/        # Analytics views
│   │   └── student/              # Student dashboard
│   │       ├── browse/           # Event/club browsing
│   │       ├── events/[id]/      # Event details
│   │       └── my-clubs/         # User's clubs
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── app-sidebar.tsx           # Navigation sidebar
│   └── dashboard-header.tsx      # Dashboard header
├── hooks/                        # Custom React hooks
│   ├── useClubs.ts               # Club data hooks
│   └── useEvents.ts              # Event data hooks
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client & types
│   └── utils.ts                  # Helper functions
├── public/                       # Static assets
├── scripts/                      # Database scripts
│   ├── init-database-v2.sql      # Database schema
│   ├── functions.sql             # Database functions
│   ├── rls-policies.sql          # Row Level Security
│   └── seed-data-v2.sql          # Sample data
├── styles/                       # Additional styles
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui config
├── next.config.mjs               # Next.js config
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

---

## 🗄️ Database Schema

### Core Tables

- **`users`**: User profiles with roles (student/organizer)
- **`clubs`**: Club information with verification status
- **`pending_clubs`**: Temporary storage for club verification
- **`events`**: Event details with registration tracking
- **`club_memberships`**: User-club relationships
- **`event_registrations`**: Event registration records

For detailed schema, see [`scripts/init-database-v2.sql`](./scripts/init-database-v2.sql)

---

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload images to Vercel Blob |
| `/api/send-club-pin` | POST | Send verification PIN via email |

---

## 📜 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables

3. **Set environment variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   BLOB_READ_WRITE_TOKEN
   RESEND_API_KEY
   ```

4. **Deploy**
   - Vercel will automatically build and deploy your application

For detailed deployment instructions, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 🎨 Demo

> **Note**: Add screenshots or GIF demos of your application here

### Student Dashboard
![Student Dashboard](./public/screenshots/student-dashboard.png)

### Organizer Dashboard
![Organizer Dashboard](./public/screenshots/organizer-dashboard.png)

### Event Creation
![Event Creation](./public/screenshots/event-creation.png)

---

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions
- [Database Guide](./docs/DATABASE.md) - Database schema and migrations
- [API Documentation](./docs/API.md) - API endpoints and usage
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/yourusername/clunite/issues) to report bugs or request features.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Vercel](https://vercel.com/) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 📞 Support

For support, email support@clunite.com or join our [Discord community](https://discord.gg/clunite).

---

<div align="center">

**Made with ❤️ for campus communities**

⭐ Star us on GitHub — it helps!

[Report Bug](https://github.com/yourusername/clunite/issues) • [Request Feature](https://github.com/yourusername/clunite/issues)

</div>
