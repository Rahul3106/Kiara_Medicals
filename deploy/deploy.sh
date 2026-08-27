#!/bin/bash
set -e

# =========================================================================
# KIARA MEDICALS — ZERO-DOWNTIME VPS DEPLOYMENT SCRIPT
# =========================================================================

echo "=========================================================="
echo "🚀 STARTING KIARA MEDICALS PRODUCTION DEPLOYMENT"
echo "⏰ Timestamp: $(date)"
echo "=========================================================="

# 1. Pull latest changes
echo "📦 Pulling latest codebase..."
git pull origin main

# 2. Install workspace dependencies
echo "📥 Installing dependencies..."
npm install --production=false

# 3. Build Vite frontend bundle
echo "🔨 Building frontend production assets..."
npm run build --workspace=client

# 4. Run Prisma database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# 5. Reload PM2 cluster with zero downtime
echo "🔄 Reloading Node.js cluster via PM2..."
if pm2 describe kiara-medicals-api > /dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

# 6. Save PM2 startup list
pm2 save

echo "=========================================================="
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=========================================================="
