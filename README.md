# AI Agent Platform - AWS 10,000 AIdeas Competition

A unified AI agent platform built for the AWS 10,000 AIdeas Competition. The platform supports two specialized agents:

1. **Ops Copilot**: Transforms messy operational inputs (emails, notes, invoices, GitHub issues) into clear weekly execution plans for solo founders
2. **Grant Navigator**: Helps NGOs, startups, and community leaders discover grants, match eligibility, and draft proposals in multiple languages

## 🏆 Competition Entry

This project is our entry for the [AWS 10,000 AIdeas Competition](https://aws.amazon.com/developer/community/10000-aideas/), competing in the **Workplace Efficiency** and **Social Impact** tracks.

## 🚀 Live Demo

Visit our landing page: [AI Agent Platform Demo](https://ai-agent-platform.vercel.app)

## 🏗️ Architecture

Built entirely on AWS services for maximum reliability and cost-effectiveness:

- **Amazon Bedrock** (Claude 3 Sonnet) for AI reasoning
- **AWS Lambda** for serverless orchestration  
- **Amazon DynamoDB** for state management
- **Amazon S3** for document storage with encryption
- **Amazon Transcribe** for audio processing
- **API Gateway** for REST endpoints

## 📁 Monorepo Structure

```
ai-agent-platform/
├── apps/
│   └── landing/          # Next.js landing page
├── packages/
│   └── backend/          # AWS Lambda functions & services
├── .kiro/specs/          # Specification documents
└── infrastructure/       # Terraform/CloudFormation (coming soon)
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- AWS CLI configured

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Individual Package Development

```bash
# Backend development
cd packages/backend
pnpm dev

# Landing page development  
cd apps/landing
pnpm dev
```

## 🤖 AI Agents

### Ops Copilot
- **Target**: Solo founders, entrepreneurs
- **Input**: Emails, notes, invoices, GitHub issues
- **Output**: Structured weekly execution plans with priorities, deadlines, and alerts
- **Features**: Task prioritization, dependency tracking, productivity metrics

### Grant Navigator
- **Target**: NGOs, social impact startups, community organizations
- **Input**: Organization profile and mission
- **Output**: Matched grants with eligibility scores and proposal drafts
- **Features**: Multilingual support (EN/ES/PT), eligibility assessment, budget planning

## 🔧 Technical Highlights

- **TypeScript**: Type-safe development with comprehensive error handling
- **Property-Based Testing**: Using fast-check for robust validation
- **Monorepo**: Organized with Turbo for efficient builds and development
- **AWS Free Tier Optimized**: Careful resource monitoring and cost optimization
- **Security**: End-to-end encryption, API key authentication, row-level security

## 📊 Competition Details

- **Prize Pool**: $250,000 total across all categories
- **Participants**: 10,000+ developers worldwide
- **Timeline**: Dec 2025 - Apr 2026
- **Our Tracks**: Workplace Efficiency & Social Impact

## 🌍 Social Impact

Special focus on serving underrepresented markets:
- **LATAM & Global South**: Multilingual grant discovery
- **NGOs**: Simplified grant application process
- **Solo Founders**: Accessible operational efficiency tools

## 📚 Documentation

- [Requirements Document](.kiro/specs/ai-agent-platform/requirements.md)
- [Design Document](.kiro/specs/ai-agent-platform/design.md)  
- [Implementation Tasks](.kiro/specs/ai-agent-platform/tasks.md)

## 🚀 Deployment

The platform is designed for easy deployment on AWS:

```bash
# Deploy backend (coming soon)
cd packages/backend
pnpm deploy

# Deploy landing page
cd apps/landing
pnpm build
# Deploy to Vercel/Netlify
```

## 🤝 Contributing

This is a competition entry, but we welcome feedback and suggestions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🏆 Competition Status

- ✅ **Phase 1**: Initial submission (Jan 21, 2026)
- ⏳ **Phase 2**: Semi-finalist selection (Feb 11, 2026)
- ⏳ **Phase 3**: Prototype development (Mar 13, 2026)
- ⏳ **Phase 4**: Final judging (Apr 30, 2026)

---

Built with ❤️ for the AWS 10,000 AIdeas Competition