#!/bin/bash

# AI Agent Platform Deployment Script

set -e

echo "🚀 Deploying AI Agent Platform..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build all packages
echo "🔨 Building packages..."
pnpm run build

# Deploy landing page to Vercel
echo "🌐 Deploying landing page..."
cd apps/landing

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy
vercel --prod

echo "✅ Deployment complete!"
echo "🎉 Your AI Agent Platform is now live!"