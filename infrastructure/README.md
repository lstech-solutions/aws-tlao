# TLÁO.COM Infrastructure

AWS infrastructure as code for tláo.com domain management.

> Legacy note
> Current production uses direct `Route53 -> GitHub Pages` for the apex site.
> The CloudFront redirect assets are intentionally retained under
> [aws-redirect](/home/ed/Documents/LSTS/aws/infrastructure/aws-redirect/README.md)
> and [redirect-cloudfront.yml](/home/ed/Documents/LSTS/aws/infrastructure/redirect-cloudfront.yml)
> as deprecated reference-only infrastructure for possible future redirect flows.
> They are not part of the active production path.

## Features

1. **GitHub Pages DNS**: Point tláo.com directly to GitHub Pages
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
├── aws-redirect/           # Legacy CloudFront redirect path (deprecated, kept for future reuse)
├── cloudformation/          # CloudFormation templates
│   ├── domain-redirect.yaml # Active Route53 -> GitHub Pages DNS template
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

### GitHub Pages DNS

```
tláo.com → Route53 → GitHub Pages
```

### Legacy CloudFront Redirect

```
tláo.com → Route53 → CloudFront → S3 redirect
```

This legacy path is kept in the repo for future optional redirect use, but it is not active today.

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

For issues: dev@lstech.solutions
