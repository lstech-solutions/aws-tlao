# TLÁO.COM Infrastructure

AWS infrastructure as code for tláo.com domain management.

## Features

1. **Domain Redirect**: Redirect tláo.com → GitHub Pages
2. **Email Forwarding**: Forward emails from @tláo.com to @lstech.solutions

## Quick Start

### 1. Setup Configuration

```bash
cd infrastructure
cp sensitive/config.example.yaml sensitive/config.yaml
nano sensitive/config.yaml  # Fill in your values
```

### 2. Deploy Infrastructure

```bash
./scripts/deploy.sh
```

### 3. Post-Deployment

Follow the instructions in [docs/post-deployment.md](docs/post-deployment.md)

## Directory Structure

```
infrastructure/
├── cloudformation/          # CloudFormation templates
│   ├── domain-redirect.yaml
│   └── email-forwarding.yaml
├── scripts/                 # Deployment and management scripts
│   ├── deploy.sh
│   └── manage-emails.sh
├── sensitive/              # Git-ignored sensitive files
│   ├── config.yaml         # Your actual config (git-ignored)
│   ├── config.example.yaml # Example template
│   └── README.md
├── docs/                   # Documentation
│   └── post-deployment.md
└── README.md              # This file
```

## Managing Email Forwards

### List current rules

```bash
./scripts/manage-emails.sh list
```

### Add a new forwarding rule

```bash
./scripts/manage-emails.sh add support@tláo.com support@lstech.solutions
```

### Remove a forwarding rule

```bash
./scripts/manage-emails.sh remove support@tláo.com
```

### Sync config file to Lambda

```bash
./scripts/manage-emails.sh sync
```

## Architecture

### Domain Redirect

```
tláo.com → Route53 → CloudFront → S3 → GitHub Pages
```

### Email Forwarding

```
Email → Route53 MX → SES → S3 + Lambda → SES → Destination
```

## Documentation

- [Post-Deployment Setup](docs/post-deployment.md)
- [Sensitive Files](sensitive/README.md)

## Security

- All sensitive files are in `sensitive/` directory (git-ignored)
- Never commit `config.yaml` or other sensitive files
- Use IAM roles instead of access keys when possible
- Rotate credentials regularly

## Support

For issues: admin@lstech.solutions
