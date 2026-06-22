#!/bin/bash

#############################################
# NexxoHub Deployment Script
# Automated deployment to production
# Status: Ready to use
#############################################

set -e  # Exit on error

echo "🚀 NexxoHub Deployment Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
fi
print_success "npm $(npm --version) found"

# Check git
if ! command -v git &> /dev/null; then
    print_error "Git not found"
    exit 1
fi
print_success "Git found"

# Check for .env.local
if [ ! -f ".env.local" ]; then
    print_error ".env.local not found!"
    print_warning "Create .env.local with your Supabase credentials:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
    echo "  NEXT_PUBLIC_APP_VERSION=1.0.0"
    exit 1
fi
print_success ".env.local found"

echo ""
print_step "Step 1: Installing dependencies..."
npm ci --silent
print_success "Dependencies installed"

echo ""
print_step "Step 2: Running linter..."
npm run lint -- --max-warnings 0 || print_warning "Lint warnings found (non-blocking)"
print_success "Lint check complete"

echo ""
print_step "Step 3: Type checking..."
npm run typecheck
print_success "Type check passed"

echo ""
print_step "Step 4: Running tests..."
npm run test -- --run --reporter=verbose
print_success "All tests passed!"

echo ""
print_step "Step 5: Building for production..."
npm run build
print_success "Production build successful"

echo ""
print_step "Step 6: Checking build output..."
if [ -d ".next" ]; then
    print_success "Build artifacts found (.next directory)"
else
    print_error "Build failed - .next directory not found"
    exit 1
fi

echo ""
print_step "Step 7: Verifying git status..."
if [ -z "$(git status --porcelain)" ]; then
    print_success "Working directory clean"
else
    print_warning "Uncommitted changes found:"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
print_step "Step 8: Git commit and push..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    print_warning "Current branch is '$BRANCH', not 'main'"
    print_warning "Deployment requires push to 'main' branch"
    read -p "Switch to main and continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    git checkout main
    git pull origin main
fi

# Commit if needed
if [ -n "$(git status --porcelain)" ]; then
    print_step "Committing changes..."
    git add -A
    git commit -m "Deploy: Production release v$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')"
    print_success "Changes committed"
fi

# Push to main
print_step "Pushing to main branch..."
git push origin main
print_success "Pushed to main branch"

echo ""
echo "════════════════════════════════════════"
print_success "DEPLOYMENT INITIATED!"
echo "════════════════════════════════════════"
echo ""
echo "What happens next:"
echo "  1. GitHub Actions CI pipeline starts"
echo "  2. Tests run automatically"
echo "  3. Build verification"
echo "  4. Deploy to staging"
echo "  5. Deploy to production"
echo ""
echo "Monitor at:"
echo "  🔗 GitHub: https://github.com/yourusername/nexxohub-plataforma/actions"
echo "  🔗 Vercel: https://vercel.com/dashboard"
echo ""
echo "View logs:"
echo "  • GitHub Actions: Actions tab in your repo"
echo "  • Vercel: Project → Deployments → View logs"
echo ""
print_warning "IMPORTANT: This script assumes you've already:"
echo "  ✓ Created Vercel project"
echo "  ✓ Connected GitHub repo"
echo "  ✓ Set environment variables in Vercel"
echo "  ✓ Setup Supabase project"
echo "  ✓ Ran database migrations"
echo ""
print_step "Next steps in DEPLOYMENT.md and GETTING_STARTED.md"
echo ""
