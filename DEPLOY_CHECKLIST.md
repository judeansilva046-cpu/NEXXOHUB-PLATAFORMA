# Deployment Checklist - NexxoHub v1.0.0

**Status**: Ready to Deploy  
**Date**: June 21, 2026  
**Next Step**: Follow this checklist step-by-step  

---

## 📋 Pre-Deployment Checklist

### ✅ STEP 1: Supabase Setup (5 minutes)

**What to do:**
```
1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up OR Login
4. Click "New Project"
   - Name: nexxohub
   - Region: São Paulo (Brazil)
   - Password: [SAVE THIS!]
5. Wait 2 minutes for database to be created
```

**After creation:**
```
1. Go to: Settings → API
2. Copy these values:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Save in a text file (you'll need these)
```

**Screenshot guide:**
```
Dashboard → Settings (left sidebar) → API
│
├─ Project URL: https://xxx.supabase.co
├─ anon public: eyJ...
├─ service_role: eyJ... (DO NOT SHARE)
└─ JWT Secret: ... (DO NOT SHARE)
```

✅ **When done**: You have URL + Anon Key

---

### ✅ STEP 2: Run Database Migrations (3 minutes)

**In Supabase Dashboard:**
```
1. Click: SQL Editor (left sidebar)
2. Click: New Query
3. Copy-paste entire content from:
   nexxohub-plataforma/supabase/migrations/001_create_base_schema.sql
4. Click: "Run" (blue button)
5. Wait for completion ✅
```

**Expected result:**
```
Success messages like:
- Tables created
- Policies created
- Indexes created
```

**Verify:**
```
1. Go to: Table Editor (left sidebar)
2. You should see:
   ✅ organizations
   ✅ users
   ✅ clinics
   ✅ companies
   ✅ employees
   ... etc
```

✅ **When done**: Database is ready with tables + security

---

### ✅ STEP 3: Vercel Setup (5 minutes)

**What to do:**
```
1. Go to: https://vercel.com
2. Click "Sign Up" or "Log In"
3. Connect GitHub account (if not already)
4. Go to: https://vercel.com/new
5. Click: "Select" next to nexxohub-plataforma
6. Click: "Import"
```

**Configuration (auto-detected but verify):**
```
Framework Preset:          Next.js
Root Directory:            ./
Build Command:             npm run build
Start Command:             npm start
Install Command:           npm ci
```

**Environment Variables - IMPORTANT!**
```
Click: "Add New"

Add these (from Step 1):
┌─────────────────────────────────────────┐
│ NEXT_PUBLIC_SUPABASE_URL                │
│ Value: https://xxx.supabase.co          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ NEXT_PUBLIC_SUPABASE_ANON_KEY           │
│ Value: eyJ...                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ NEXT_PUBLIC_APP_VERSION                 │
│ Value: 1.0.0                            │
└─────────────────────────────────────────┘
```

**Deploy:**
```
Click: "Deploy" (button at bottom)

Wait 2-3 minutes...
You'll see status changing:
- Building...
- Ready ✅
```

✅ **When done**: Vercel URL is live!

---

### ✅ STEP 4: Create .env.local (1 minute)

**In your project folder:**

```bash
# Create .env.local file with:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Where to get values:**
- `NEXT_PUBLIC_SUPABASE_URL` → From Step 1
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → From Step 1
- `NEXT_PUBLIC_APP_VERSION` → Use: 1.0.0

✅ **When done**: .env.local exists with correct values

---

### ✅ STEP 5: Run Deploy Script (10 minutes)

**In terminal:**

```bash
# Make script executable
chmod +x deploy.sh

# Run it
./deploy.sh
```

**What it does:**
```
✅ Checks Node.js, npm, git
✅ Installs dependencies
✅ Runs linter
✅ Runs type check
✅ Runs all tests
✅ Builds for production
✅ Commits to git
✅ Pushes to main branch
```

**Expected output:**
```
✅ Node.js found
✅ npm found
✅ .env.local found
✅ Dependencies installed
✅ Lint check complete
✅ Type check passed
✅ All tests passed!
✅ Production build successful
✅ Pushed to main branch

🚀 DEPLOYMENT INITIATED!
```

✅ **When done**: Pushed to GitHub main branch

---

### ✅ STEP 6: GitHub Actions (Automatic - 5 minutes)

**What happens automatically:**
```
1. Tests run (should pass ✅)
2. Build verified
3. Deploy to staging
4. Deploy to production
```

**Monitor progress:**

**Option A: GitHub Actions**
```
1. Go to: https://github.com/yourusername/nexxohub-plataforma
2. Click: Actions tab
3. See workflow running
4. Wait for green checkmarks ✅
```

**Option B: Vercel**
```
1. Go to: https://vercel.com/dashboard
2. Select: nexxohub-plataforma project
3. Click: Deployments
4. See current deployment
5. Status: Ready ✅
```

✅ **When done**: Deployment complete!

---

## 🔍 Verification Checklist

After deployment, verify everything works:

### Test 1: Website Loads
```bash
# In terminal or browser
curl https://app.nexxohub.com

# Expected: HTML content (200 OK)
```

### Test 2: Health Check
```bash
curl https://app.nexxohub.com/api/health

# Expected output:
{
  "status": "healthy",
  "timestamp": "2026-06-21T...",
  "database": "connected",
  "auth": "connected",
  "version": "1.0.0"
}
```

### Test 3: Login Page
```
1. Open: https://app.nexxohub.com
2. Click: "Entrar" (or login link)
3. Should show login form
4. Try username/password (or email signup)
```

### Test 4: Protected Routes
```
1. Try to access: https://app.nexxohub.com/dashboard
2. Should redirect to: /auth/login
3. That's correct! ✅
```

### Test 5: Database Connection
```
1. In Supabase Dashboard
2. Check: Database status (green)
3. Check: Connection count
4. Should see active connections
```

---

## ✅ Final Checklist

- [ ] Supabase project created
- [ ] Database migrations ran
- [ ] .env.local file created
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] deploy.sh ran successfully
- [ ] Code pushed to main
- [ ] GitHub Actions passed
- [ ] Website loads (https://app.nexxohub.com)
- [ ] Health check works
- [ ] Login page accessible
- [ ] Protected routes redirect to login
- [ ] Database connected

---

## 🆘 Troubleshooting

### "Build failed"
```
Vercel Dashboard → Deployments → Click failed build → View logs
Most common:
- Missing env variables → Add them
- Wrong SUPABASE_URL → Check format
- Database not migrated → Run migrations again
```

### "Health check returns error"
```
Check:
1. NEXT_PUBLIC_SUPABASE_URL is correct
2. NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Supabase database is running
4. Migrations were executed
```

### "Login doesn't work"
```
Check:
1. User exists in Supabase users table
2. Organization exists in organizations table
3. Auth policies are correct
```

### "404 Not Found"
```
Wait 2-3 minutes for:
- DNS propagation
- CDN caching
- Try hard refresh: Ctrl+Shift+R
```

---

## 📞 Support

**If something goes wrong:**

1. **Check logs:**
   - Vercel: Project → Deployments → View logs
   - GitHub: Actions → Workflow → View details

2. **Read docs:**
   - DEPLOYMENT.md - Detailed guide
   - GETTING_STARTED.md - Quick start
   - MONITORING.md - Monitoring setup

3. **Common commands:**
   ```bash
   # Test locally
   npm run dev
   npm run test -- --run
   
   # Rebuild
   npm run build
   
   # Check types
   npm run typecheck
   ```

---

## 🎉 Success!

When you see:
```
✅ Website loads
✅ Health check responds
✅ Login page visible
✅ Protected routes redirect
```

**You're live! 🚀**

Next: Setup monitoring in MONITORING.md

---

**Status**: Ready to Deploy  
**Time Estimate**: 30 minutes total  
**Difficulty**: Easy (copy-paste mostly)  
**Prerequisite**: GitHub account, Email account  

**Let's go! 🚀**
