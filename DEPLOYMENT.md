# Deployment Guide - AI Agent Platform

This guide covers deploying the AI Agent Platform for the AWS 10,000 AIdeas Competition.

## 🚀 Quick Deploy

### Option 1: Automated Script
```bash
./scripts/deploy.sh
```

### Option 2: Manual Deployment

#### Prerequisites
- Node.js 22.22.0
- pnpm 8+
- Vercel CLI (for frontend)
- AWS CLI (for backend)

#### Frontend (Landing Page)
```bash
# Install dependencies
pnpm install

# Build landing page
pnpm run build --filter=@ai-agent-platform/landing

# Deploy to Vercel
cd apps/landing
vercel --prod
```

#### Backend (AWS Lambda)
```bash
# Build backend
pnpm run build --filter=@ai-agent-platform/backend

# Deploy with AWS SAM or Serverless Framework
cd packages/backend
# Deploy commands will be added here
```

## 🌐 Platform Deployments

### Frontend Options

#### Vercel (Recommended)
- **URL**: https://ai-agent-platform.vercel.app
- **Features**: Automatic deployments, edge functions, analytics
- **Setup**: Connect GitHub repo, auto-deploy on push

#### Netlify
- **Features**: Form handling, edge functions, split testing
- **Setup**: Connect GitHub repo, build command: `pnpm run build --filter=@ai-agent-platform/landing`

#### AWS Amplify
- **Features**: Native AWS integration, custom domains
- **Setup**: Connect GitHub repo, configure build settings

### Backend Options

#### AWS Lambda (Recommended)
- **Services**: Lambda, API Gateway, DynamoDB, S3, Bedrock
- **Deployment**: AWS SAM, Serverless Framework, or CDK
- **Cost**: Optimized for AWS Free Tier

#### AWS App Runner
- **Features**: Containerized deployment, auto-scaling
- **Setup**: Docker container with Express.js wrapper

## 🔧 Environment Configuration

### Frontend Environment Variables
```bash
# apps/landing/.env.local
NEXT_PUBLIC_API_URL=https://api.ai-agent-platform.com
NEXT_PUBLIC_DEMO_MODE=true
```

### Backend Environment Variables
```bash
# packages/backend/.env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
DYNAMODB_USERS_TABLE=ai-agent-platform-users
DYNAMODB_DOCUMENTS_TABLE=ai-agent-platform-documents
DYNAMODB_RESULTS_TABLE=ai-agent-platform-results
DYNAMODB_SESSIONS_TABLE=ai-agent-platform-sessions
S3_BUCKET_NAME=ai-agent-platform-documents
API_KEY_HASH_SECRET=your-secret-key-here
```

## 🏗️ Infrastructure as Code

### AWS CDK (Coming Soon)
```typescript
// infrastructure/lib/ai-agent-platform-stack.ts
export class AiAgentPlatformStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // DynamoDB Tables
    // Lambda Functions
    // S3 Buckets
    // API Gateway
    // Bedrock Permissions
  }
}
```

### Terraform (Coming Soon)
```hcl
# infrastructure/main.tf
resource "aws_dynamodb_table" "users" {
  name           = "ai-agent-platform-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  
  attribute {
    name = "userId"
    type = "S"
  }
}
```

## 🔍 Monitoring & Observability

### Frontend Monitoring
- **Vercel Analytics**: Page views, performance metrics
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior and conversion tracking

### Backend Monitoring
- **CloudWatch**: Logs, metrics, alarms
- **X-Ray**: Distributed tracing
- **Cost Explorer**: AWS cost monitoring

## 🚨 Production Checklist

### Security
- [ ] Environment variables configured
- [ ] API keys rotated and secured
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting implemented

### Performance
- [ ] CDN configured (Vercel Edge, CloudFront)
- [ ] Images optimized
- [ ] Bundle size optimized
- [ ] Database indexes created
- [ ] Caching strategies implemented

### Reliability
- [ ] Health checks configured
- [ ] Error monitoring setup
- [ ] Backup strategies implemented
- [ ] Disaster recovery plan
- [ ] Load testing completed

### Compliance
- [ ] AWS Free Tier limits monitored
- [ ] Data retention policies implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Competition requirements met

## 📊 Competition Deployment

### Timeline
- **Phase 1** (Jan 21, 2026): Landing page deployed
- **Phase 2** (Feb 11, 2026): Demo environment ready
- **Phase 3** (Mar 13, 2026): Full platform deployed
- **Phase 4** (Apr 30, 2026): Production-ready

### Requirements
- [ ] Public demo URL
- [ ] GitHub repository public
- [ ] Documentation complete
- [ ] Video demo recorded
- [ ] Article published

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules .next .turbo
pnpm install
pnpm run build
```

#### Deployment Errors
```bash
# Check logs
vercel logs
aws logs describe-log-groups
```

#### Environment Issues
```bash
# Verify environment variables
vercel env ls
aws ssm get-parameters-by-path --path "/ai-agent-platform/"
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Contact the development team

---

🏆 **Competition Ready**: This deployment guide ensures your AI Agent Platform is ready for the AWS 10,000 AIdeas Competition judging process.