# Deployment Guide

## Deploy to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/clunite)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**
   
   Add these in Vercel project settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   BLOB_READ_WRITE_TOKEN
   RESEND_API_KEY
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed site

### Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate

### Environment Variables

**Production:**
- Use production Supabase credentials
- Enable RLS policies
- Use verified email domain for Resend

**Preview:**
- Can use same credentials as production
- Or create separate Supabase project

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Post-Deployment

1. Test all features
2. Check database connections
3. Verify email sending
4. Test image uploads
5. Monitor error logs

## Troubleshooting

**Build Errors:**
- Check TypeScript errors: `npm run type-check`
- Verify all dependencies installed
- Check environment variables

**Runtime Errors:**
- Check Vercel logs
- Verify Supabase connection
- Check RLS policies
- Verify API keys
