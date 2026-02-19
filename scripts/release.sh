#!/bin/bash

# TLÁO Release Script
# Creates a production release with versioning, tagging, and deployment

set -e

echo "🚀 Starting TLÁO production release..."

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch to release"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected. Please commit or stash them first."
    exit 1
fi

# Get version type from arguments (patch, minor, major)
VERSION_TYPE="${1:-patch}"
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Error: Invalid version type. Use: patch, minor, or major"
    exit 1
fi

echo "📝 Version type: $VERSION_TYPE"

# Run versioning
echo "🔄 Running versioning..."
pnpm run version:$VERSION_TYPE

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✨ New version: $NEW_VERSION"

# Build all packages
echo "🔨 Building packages..."
pnpm run build

# Run tests
echo "🧪 Running tests..."
pnpm run test

# Type check
echo "🔍 Running type check..."
pnpm run type-check

# Commit version changes
echo "📝 Committing version changes..."
git add -A
git commit -m "chore: release v$NEW_VERSION"

# Create git tag
echo "🏷️  Creating git tag: v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push changes and tags
echo "📤 Pushing to remote..."
git push origin main
git push origin "v$NEW_VERSION"

# Deploy to production
echo "🌐 Deploying to production..."
cd apps/landing

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
vercel --prod

echo "✅ Release complete!"
echo "🎉 Version $NEW_VERSION is now live!"
echo ""
echo "📦 Published packages:"
echo "  - @ai-agent-platform/landing v$NEW_VERSION"
echo "  - @tlao/docs v$NEW_VERSION"
echo ""
echo "🔗 Production URL: https://tlao.ai"
echo "🏷️  Git tag: v$NEW_VERSION"
