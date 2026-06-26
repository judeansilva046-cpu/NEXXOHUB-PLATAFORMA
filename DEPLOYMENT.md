# Deployment Guide - NexxoHub Platform

**Status**: ✅ Ready for Production  
**Last Updated**: June 21, 2026  
**Version**: 1.0.0

---

## Quick Start (5 Minutes)

### 1. Prerequisites

- [ ] GitHub account with repo access
- [ ] Vercel account (free tier works)
- [ ] Supabase project (database ready)
- [ ] Environment variables documented

### 2. Deploy to Production

```bash
# Option A: via Vercel Dashboard (Easiest)
1. Go to vercel.com → Import Project
2. Select GitHub repository
3. Click "Import"
4. Set environment variables
5. Click "Deploy"

# Option B: via Vercel CLI
vercel --prod

# Option C: via GitHub (Automatic)
# Just merge to main branch - deploys automatically!
```

### 3. Verify Deployment

```
✅ Visit: https://app.nexxohub.com
✅ Check: /dashboard (should load)
✅ Test: Login flow works
✅ Monitor: Vercel dashboard shows green
```

---

## Detailed Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure everything is committed
git status  # Should be clean

# Push to main branch
git push origin main

# Verify remote is correct
git remote -v
```

### Step 2: Setup Vercel Project

#### Via Vercel Dashboard (Recommended)

1. **Go to** https://vercel.com/new
2. **Connect GitHub** account if not already connected
3. **Select Repository**:
   - Find `nexxohub-plataforma`
   - Click "Select"
4. **Configure Project**:
   - Framework: `Next.js`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxx...
   NEXT_PUBLIC_APP_VERSION = 1.0.0
   ```
6. **Click "Deploy"**

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Or link project first
vercel link
vercel --prod
```

### Step 3: Configure Environment Variables

#### Production Variables

Set in Vercel Dashboard → Settings → Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Optional
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

#### Staging Variables

Same as production but pointing to staging database

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
```

### Step 4: Verify Deployment

```bash
# Check build logs
# Dashboard → Project → Deployments → Click latest

# Test endpoints
curl https://app.nexxohub.com
curl https://app.nexxohub.com/api/health

# Verify database connection
# Try login with test account

# Check error tracking
# Sentry project (if configured)
```

### Step 5: Post-Deployment

- [ ] Monitor Vercel dashboard for errors
- [ ] Check Sentry for exceptions
- [ ] Verify Slack notifications working
- [ ] Test critical user flows
- [ ] Monitor database performance
- [ ] Check Web Vitals in Vercel Analytics

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│          User Browsers                   │
└────────────────┬─────────────────────────┘
                 │ HTTPS
        ┌────────▼────────┐
        │ Vercel (CDN)    │  ← Next.js frontend
        │ Edge Functions  │  ← API routes
        │ Static assets   │
        └────────┬────────┘
                 │
        ┌────────▼─────────────┐
        │ Vercel Postgres      │
        │ (Optional: use DB)   │
        └────────┬─────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
┌───▼──────────┐     ┌─────────▼────┐
│ Supabase     │     │ Supabase      │
│ Auth         │     │ Database      │
│ PostgreSQL   │     │ (Storage)     │
└──────────────┘     └───────────────┘
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project

```
supabase.com → New Project
├─ Name: nexxohub
├─ Region: Brazil (São Paulo)
└─ Database: postgres
```

### 2. Run Migrations

```bash
# Create tables and RLS policies
# File: supabase/migrations/001_create_base_schema.sql

# Option A: Via Supabase Dashboard
# → SQL Editor → Paste migration → Run

# Option B: Via Supabase CLI
supabase db push --db-url postgresql://...
```

### 3. Configure RLS Policies

```sql
-- All policies are configured in migration file
-- Policies ensure:
-- - Users only see their organization data
-- - Admins can manage everything
-- - Managers can manage their clinic/company
-- - Users have limited access
```

### 4. Create Test Users

```sql
-- Insert test organization
INSERT INTO organizations (id, name)
VALUES ('org_123', 'Test Organization');

-- Insert test users
INSERT INTO users (id, email, full_name, organization_id, role)
VALUES
  ('user_admin', 'admin@test.com', 'Admin User', 'org_123', 'admin'),
  ('user_manager', 'manager@test.com', 'Manager User', 'org_123', 'manager'),
  ('user_regular', 'user@test.com', 'Regular User', 'org_123', 'user');
```

---

## Custom Domain Setup

### Connecting a Domain (Vercel)

1. **Go to** Vercel Dashboard → Project Settings → Domains
2. **Enter** your domain: `app.nexxohub.com`
3. **Choose**:
   - [ ] Vercel's nameservers (Easiest)
   - [ ] CNAME (if already using another DNS)
4. **Add DNS Records** (if using CNAME):
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
5. **Wait** for DNS propagation (5-30 minutes)
6. **Verify** SSL certificate auto-generated

### DNS Configuration

```dns
; Vercel nameservers
NS1.VERCEL-DNS.COM
NS2.VERCEL-DNS.COM

; Or CNAME for subdomain
app.nexxohub.com  CNAME  cname.vercel-dns.com
```

---

## SSL/TLS Certificate

### Automatic (Vercel Handles)

- ✅ Auto-generates for all domains
- ✅ Renews automatically
- ✅ No action needed
- ✅ Free with Vercel

### Verify Certificate

```bash
# Check certificate
openssl s_client -connect app.nexxohub.com:443

# Or visit in browser
# Should show green lock 🔒
```

---

## Environment Variables

### Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

### Optional (But Recommended)

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_ID=UA-xxx-x

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Feature Flags
NEXT_PUBLIC_FEATURE_MFA_ENABLED=true
NEXT_PUBLIC_FEATURE_AUDIT_LOG_ENABLED=true
```

### Never Commit

```bash
# These should NEVER be in git
SUPABASE_SERVICE_ROLE_KEY  # Private key
DATABASE_PASSWORD          # Database password
API_SECRET_KEY            # Secret keys
ENCRYPTION_KEYS           # Encryption keys
```

---

## Performance Optimization

### Vercel Analytics

```
Dashboard → Project → Analytics → Enable
```

Tracks:

- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ Edge function performance
- ✅ Cache hit rates
- ✅ Deployment duration

### Database Performance

```sql
-- Monitor slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_clinics_search ON clinics(name, cnpj);
```

### Image Optimization

```typescript
// Next.js automatically optimizes
import Image from 'next/image';

<Image
  src="/clinic.jpg"
  alt="Clinic"
  width={400}
  height={300}
  priority  // Load first
/>
```

---

## Monitoring & Logging

### Vercel Logs

```
Dashboard → Project → Logs → View
```

Shows:

- Build logs
- Deployment logs
- Runtime logs
- Error logs

### Error Tracking (Sentry)

Setup:

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Real-time Monitoring

Recommended services:

- **Vercel Analytics** - Built-in, free
- **Sentry** - Error tracking
- **LogRocket** - User session replay
- **New Relic** - Full stack monitoring

---

## Backup & Recovery

### Database Backups

```bash
# Supabase handles automatic backups
# Retention: 30 days (free), 90 days (pro)

# Manual backup
pg_dump -h xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore from backup
psql -h xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Code Rollback

```bash
# If deployment breaks, rollback to previous version

# Option 1: Vercel Dashboard
# → Deployments → Click previous → "Redeploy This"

# Option 2: Git revert
git revert <commit-hash>
git push origin main
# Automatic redeploy!

# Option 3: Disable current deployment
# → Settings → Deployments → Disable
```

---

## Scaling for Growth

### Current Capacity

```
Vercel Pro:
├─ 100 edge functions
├─ 50GB per function
├─ 5,000 req/sec
└─ Premium support

Database (Supabase Pro):
├─ 8GB PostgreSQL
├─ Automatic backups
├─ 100+ concurrent connections
└─ Replication support
```

### When to Scale

| Metric        | Current        | Action           |
| ------------- | -------------- | ---------------- |
| Users         | < 1,000        | No action        |
| Users         | 1,000 - 10,000 | Monitor          |
| Users         | > 10,000       | Upgrade DB       |
| API Calls     | < 100k/day     | No action        |
| API Calls     | > 1M/day       | Consider caching |
| Database Size | < 2GB          | No action        |
| Database Size | > 5GB          | Optimize queries |

### Scaling Strategies

1. **Database**:

   ```
   Supabase → Database → Upgrade Plan
   ```

2. **Edge Functions**:

   ```
   Vercel → Settings → Increase Concurrency
   ```

3. **Caching**:

   ```typescript
   // Add Redis cache layer
   const redis = new Redis(process.env.REDIS_URL);
   ```

4. **CDN**:
   ```
   Already provided by Vercel
   308 edge locations worldwide
   ```

---

## Security Checklist

- [ ] HTTPS enforced (automatic)
- [ ] Environment variables set
- [ ] Database RLS policies enabled
- [ ] No secrets in code
- [ ] Sentry configured for errors
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers present
- [ ] Backups configured
- [ ] Monitoring enabled

---

## Troubleshooting

### Build Fails

```bash
# Check build logs
vercel logs --build

# Common issues:
# 1. Missing env vars → Add to Vercel
# 2. Dependency error → npm install locally, push
# 3. Type error → npm run typecheck locally
# 4. Memory limit → Optimize code, split chunks
```

### Website Down

```
1. Check status.vercel.com
2. View Vercel dashboard logs
3. Check GitHub Actions logs
4. Review recent commits
5. Rollback if needed
```

### Database Connection Issues

```sql
-- Test connection
SELECT NOW();  -- Should return current time

-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- View active queries
SELECT query, state FROM pg_stat_activity;
```

### Slow Performance

```bash
# Check Web Vitals
# Vercel → Analytics

# Optimize:
1. Database queries (add indexes)
2. Images (use next/image)
3. Code splitting (reduce bundle)
4. API caching (implement)
```

---

## Support & Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

### Community

- [Vercel Discord](https://vercel.com/community)
- [Next.js Discord](https://discord.gg/next-js)

### Help

- [Vercel Support](https://vercel.com/support)
- [Supabase Support](https://supabase.com/support)

---

## Post-Launch Checklist

- [ ] Domain configured
- [ ] SSL certificate verified
- [ ] Monitoring enabled
- [ ] Error tracking active
- [ ] Backups configured
- [ ] Performance baseline established
- [ ] Team has access
- [ ] Documentation updated
- [ ] Analytics configured
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Go-live announcement sent

---

**Status**: ✅ Ready to Deploy  
**Next Step**: Push to main branch or click Deploy on Vercel  
**Support**: Check logs or contact team

---

Version: 1.0.0  
Last Updated: June 21, 2026  
Maintained By: DevOps Team
