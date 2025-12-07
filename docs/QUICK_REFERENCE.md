# Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
```

### Git Workflow
```bash
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
git pull             # Pull latest changes
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Local environment variables (gitignored) |
| `.env.example` | Environment template for others |
| `README.md` | Main project documentation |
| `package.json` | Dependencies and scripts |
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |

## 🗂️ Directory Guide

| Directory | Contents |
|-----------|----------|
| `app/` | Next.js pages and routes |
| `components/` | React components |
| `lib/` | Utility functions |
| `hooks/` | Custom React hooks |
| `public/` | Static assets |
| `scripts/` | Database scripts |
| `docs/` | Documentation |

## 🔧 Configuration Files

- **TypeScript**: `tsconfig.json`
- **ESLint**: `.eslintrc.json`
- **Prettier**: `.prettierrc`
- **Tailwind**: `tailwind.config.ts`
- **shadcn/ui**: `components.json`

## 🌐 Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BLOB_READ_WRITE_TOKEN=
RESEND_API_KEY=
```

## 📚 Documentation Links

- [Setup Guide](./SETUP.md)
- [Database Guide](./DATABASE.md)
- [API Docs](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Project Structure](./PROJECT_STRUCTURE.md)

## 🐛 Troubleshooting

**Build fails?**
- Run `npm run type-check`
- Check for missing dependencies
- Verify environment variables

**Database errors?**
- Check Supabase connection
- Verify RLS policies
- Check SQL scripts ran correctly

**Auth not working?**
- Verify Supabase keys
- Check user roles
- Review middleware.ts

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org/docs)
