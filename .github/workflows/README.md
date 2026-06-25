# CI/CD Pipeline Documentation

## Overview

The NexxoHub platform has a complete CI/CD pipeline configured with GitHub Actions for automated testing, building, and deployment.

## Pipelines

### 1. CI Pipeline (`ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
1. **Lint & Format** - Code quality checks
   - ESLint
   - Prettier format check
   - TypeScript type checking

2. **Unit Tests** - Run all unit tests
   - Vitest runner
   - Coverage reporting
   - Codecov upload

3. **Build** - Verify build succeeds
   - Next.js build
   - Bundle analysis
   - Artifact storage

4. **Security Checks** - Security validation
   - `npm audit` for vulnerabilities
   - Secret detection (Truffle Hog)

5. **E2E Tests** - End-to-end tests (PR only)
   - Playwright tests
   - Cross-browser testing
   - Report artifacts

6. **Quality Gate** - All checks must pass

### 2. Deploy Pipeline (`deploy.yml`)

**Triggers**:
- Push to `main` branch
- File changes in specific paths
- Manual trigger (`workflow_dispatch`)

**Stages**:
1. **Validation** - Pre-deploy checks
   - Full test suite
   - Build verification

2. **Staging** - Deploy to staging environment
   - Vercel staging deployment
   - Smoke tests
   - Health checks

3. **Production** - Deploy to production
   - Vercel production deployment
   - Smoke tests
   - Health checks
   - Deployment status update
   - Release creation

4. **Rollback** - Automatic notifications on failure
   - Slack alerts
   - GitHub issue creation

## Setup Instructions

### Prerequisites

1. **GitHub Repository** - Connected and configured
2. **Vercel Account** - Project connected
3. **Supabase Project** - Staging and production databases
4. **Slack Workspace** (Optional) - For notifications

### Required Secrets

Set these in GitHub Settings → Secrets and Variables → Actions:

#### Vercel Secrets
```
VERCEL_TOKEN              # Vercel API token
VERCEL_ORG_ID            # Vercel organization ID
VERCEL_PROJECT_ID_STAGING    # Staging project ID
VERCEL_PROJECT_ID_PRODUCTION # Production project ID
```

#### Supabase Secrets
```
SUPABASE_URL             # Supabase project URL
SUPABASE_ANON_KEY        # Public anon key
SUPABASE_SERVICE_ROLE_KEY # Service role key (for E2E)
```

#### Slack Secrets (Optional)
```
SLACK_WEBHOOK            # Slack webhook URL for notifications
```

#### Codecov Secrets (Optional)
```
CODECOV_TOKEN            # Codecov.io token
```

### Setup Steps

1. **Get Vercel Token**:
   ```bash
   # Go to vercel.com → Settings → Tokens
   # Create new token, copy it
   ```

2. **Add GitHub Secrets**:
   ```
   GitHub Repo → Settings → Secrets and Variables → Actions → New repository secret
   ```

3. **Configure Staging Vercel Project**:
   ```
   vercel env pull  # Pull environment variables
   ```

4. **Configure Production Vercel Project**:
   ```
   vercel env pull --environment=production
   ```

5. **Enable Branch Protection**:
   ```
   GitHub Repo → Settings → Branches → Add rule
   Branch name pattern: main
   ✓ Require status checks to pass before merging
   ✓ Require branches to be up to date
   ✓ Dismiss stale pull request approvals
   ```

## Workflow Status

### For Pull Requests

```
┌─────────────────────────────────────────┐
│ Author creates PR to main/develop       │
├─────────────────────────────────────────┤
│ CI Pipeline starts automatically        │
│ ├─ Lint & Format                        │
│ ├─ Unit Tests                           │
│ ├─ Build                                │
│ ├─ Security Checks                      │
│ └─ E2E Tests                            │
├─────────────────────────────────────────┤
│ All checks must pass ✅                 │
│ Code review approved                    │
└─ Merge to main/develop                  │
```

### For Merges to Main

```
┌─────────────────────────────────────────┐
│ Author merges PR to main                │
├─────────────────────────────────────────┤
│ Deploy Pipeline starts automatically    │
│ ├─ Validation                           │
│ ├─ Deploy to Staging                    │
│ │  ├─ Smoke tests                       │
│ │  └─ Health checks                     │
│ ├─ Deploy to Production                 │
│ │  ├─ Smoke tests                       │
│ │  ├─ Health checks                     │
│ │  └─ Create release                    │
│ └─ Slack notification                   │
└─ Monitor https://app.nexxohub.com      │
```

## Commands & Local Testing

### Run Tests Locally

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Local Build & Serve

```bash
# Build
npm run build

# Serve locally
npm start

# Check what will be deployed
vercel preview
```

### Check What CI Will Do

```bash
# Run all CI checks locally
npm run lint && npm run test -- --run && npm run build

# Or use act (GitHub Actions locally)
act push -b main
```

## Deployment Process

### Automatic Deployment Flow

1. **Develop in Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git push origin feature/my-feature
   ```

2. **Create Pull Request**
   - Push to GitHub
   - Click "Compare & pull request"
   - CI pipeline runs automatically ✅

3. **Review & Approve**
   - Code review
   - All CI checks pass
   - Click "Merge pull request"

4. **Deploy to Staging**
   - Automatic deployment to staging
   - Smoke tests run
   - Slack notification

5. **Deploy to Production**
   - Automatic deployment to production
   - Health checks
   - Release created
   - Slack notification

### Manual Deployment

```bash
# Trigger deploy pipeline manually
# Go to GitHub Actions → Deploy Pipeline → Run workflow
# Select branch and click "Run workflow"
```

### Rollback

```bash
# If production breaks, revert the commit
git revert <commit-hash>
git push origin main

# Or manually from Vercel dashboard:
# Vercel Project → Deployments → Select previous → Redeploy
```

## Monitoring Deployments

### GitHub Actions

```
https://github.com/yourusername/nexxohub/actions
```

### Vercel Dashboard

```
https://vercel.com/dashboard
→ Select project
→ View deployments
```

### Slack Notifications

- `#deployments` - All deployment notifications
- `#alerts` - Critical alerts and failures

## Troubleshooting

### Build Fails in CI but Works Locally

1. **Clear cache**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Check Node version**:
   ```bash
   node --version  # Should be 18+
   ```

3. **Check env variables**:
   ```bash
   cat .env.local  # Should have all required vars
   ```

### Tests Pass Locally but Fail in CI

1. **Run in CI mode**:
   ```bash
   CI=true npm run test
   ```

2. **Check test order**:
   ```bash
   npm run test -- --shuffle
   ```

### Deployment Stuck

1. **Check Vercel logs**:
   - Go to Vercel → Project → Deployments
   - Click on the stuck deployment
   - View build logs

2. **Check GitHub Actions**:
   - Go to GitHub → Actions
   - Click on the stuck workflow
   - View job details

## Performance Tips

### Speed Up CI

1. **Enable caching**:
   - Already configured with `npm ci`
   - Cache folder: `node_modules`

2. **Parallel jobs**:
   - Lint, test, security run in parallel
   - Build waits for lint & test

3. **Skip E2E for non-PRs**:
   - E2E only runs on PRs to save time
   - Controlled by `if:` condition

### Speed Up Deploy

1. **Vercel caching**:
   - Already configured
   - Build artifacts cached

2. **Smart redeploy**:
   - Only deploys on code changes
   - Ignores documentation changes

## Best Practices

### Commit Messages

```
✨ feat: Add new feature
🐛 fix: Fix critical bug
♻️  refactor: Improve code
📝 docs: Update documentation
🧪 test: Add tests
🎨 style: Format code
🔒 security: Security fix
```

### Branch Names

```
main               # Production-ready code
develop            # Integration branch
feature/...        # New feature
bugfix/...         # Bug fix
hotfix/...         # Critical production fix
```

### PR Guidelines

1. **Title**: Clear and descriptive
2. **Description**: What changed and why
3. **Tests**: All new code has tests
4. **Coverage**: Coverage stays above 80%
5. **Checks**: All CI checks pass ✅

## Monitoring & Alerts

### GitHub Status Checks

- ✅ Required: Lint, Test, Build, Security
- ✓ Optional: E2E tests
- Status badge in README shows health

### Slack Alerts

- Deploy started/completed
- Critical failures
- Test coverage changes

### Sentry (Ready to configure)

- Error tracking
- Performance monitoring
- Release tracking

## Support

### Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to build" | Check logs in Actions tab |
| "Tests failing" | Run `npm test` locally |
| "Deploy stuck" | Check Vercel dashboard |
| "Secrets not found" | Add to GitHub Secrets |

### Getting Help

1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Check Slack for notifications
4. Ask in team channel

---

**Last Updated**: June 21, 2026  
**Status**: ✅ Production Ready  
**Maintained By**: DevOps Team
