#!/bin/bash

# Deployment script for TLÁO Documentation
# Supports both GitHub Pages and custom domain deployment

set -e

echo "🚀 TLÁO Documentation Deployment Script"
echo "========================================"

# Default values
ENVIRONMENT=${1:-"github-pages"}
SITE_URL=""
BASE_URL=""
OUTPUT_DIR=""

case $ENVIRONMENT in
  "github-pages")
    echo "📦 Building for GitHub Pages..."
    SITE_URL="https://lstech-solutions.github.io"
    BASE_URL="/aws-tlao/"
    OUTPUT_DIR="build-github"
    ;;
  "custom-domain")
    echo "🌐 Building for Custom Domain (tláo.com)..."
    SITE_URL="https://tláo.com"
    BASE_URL="/"
    OUTPUT_DIR="build-custom"
    ;;
  "aws")
    echo "☁️ Building for AWS S3/CloudFront..."
    SITE_URL="https://docs.tláo.com"
    BASE_URL="/"
    OUTPUT_DIR="build-aws"
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 [github-pages|custom-domain|aws]"
    exit 1
    ;;
esac

echo ""
echo "📊 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Site URL: $SITE_URL"
echo "  Base URL: $BASE_URL"
echo "  Output Directory: $OUTPUT_DIR"
echo ""

# Build Docusaurus site
echo "🔨 Building Docusaurus site..."
SITE_URL="$SITE_URL" BASE_URL="$BASE_URL" npm run build

# Move build output to environment-specific directory
echo "📁 Moving build output to $OUTPUT_DIR..."
rm -rf $OUTPUT_DIR
mv build $OUTPUT_DIR

echo ""
echo "✅ Build completed successfully!"
echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Deployment instructions
case $ENVIRONMENT in
  "github-pages")
    echo "📋 GitHub Pages Deployment Instructions:"
    echo "  1. Commit and push the $OUTPUT_DIR directory"
    echo "  2. Configure GitHub Pages to serve from /$OUTPUT_DIR"
    echo "  3. Add custom domain in GitHub Pages settings if needed"
    ;;
  "custom-domain")
    echo "📋 Custom Domain Deployment Instructions:"
    echo "  1. Upload $OUTPUT_DIR contents to your web hosting"
    echo "  2. Configure DNS to point to your hosting provider"
    echo "  3. Set up SSL certificate for HTTPS"
    ;;
  "aws")
    echo "📋 AWS Deployment Instructions:"
    echo "  1. Create S3 bucket: docs.tláo.com"
    echo "  2. Upload $OUTPUT_DIR contents to S3"
    echo "  3. Configure CloudFront distribution"
    echo "  4. Set up Route 53 for DNS"
    echo "  5. Configure SSL certificate in ACM"
    ;;
esac

echo ""
echo "🎉 Done!"