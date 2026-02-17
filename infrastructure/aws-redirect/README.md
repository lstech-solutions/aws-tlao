# AWS Redirect Infrastructure for tláo.com

This directory contains the infrastructure setup to redirect `tláo.com` to `lstech-solutions.github.io/aws-tlao/`.

## Architecture

```
tláo.com → CloudFront → S3 (Redirect) → lstech-solutions.github.io/aws-tlao/
```

## Components

1. **S3 Bucket**: Stores redirect configuration
2. **CloudFront Distribution**: Handles HTTPS and CDN
3. **ACM Certificate**: SSL/TLS certificate for HTTPS
4. **Route 53 Records**: DNS configuration (optional)

## Quick Start

### Prerequisites

- AWS CLI installed and configured
- AWS credentials with permissions for:
  - S3
  - CloudFront
  - ACM (Certificate Manager)
  - Route 53 (if using)

### Setup

1. **Run the setup script:**

   ```bash
   cd infrastructure/aws-redirect
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Complete SSL certificate validation:**
   - Check certificate status: `aws acm describe-certificate --certificate-arn <ARN> --region us-east-1`
   - Add the required CNAME records to your DNS

3. **Add DNS records:**
   - If using Route 53: `aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://route53-changes.json`
   - If using another DNS provider, add the records manually

4. **Test the redirect:**
   ```bash
   curl -I https://tláo.com
   # Should return 301 redirect to https://lstech-solutions.github.io/aws-tlao/
   ```

## Manual Setup

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://tláo.com

# Configure bucket for website hosting with redirect
aws s3 website s3://tláo.com \
  --index-document index.html \
  --error-document error.html \
  --redirect-all-requests-to https://lstech-solutions.github.io/aws-tlao/
```

### Step 2: Request SSL Certificate

```bash
aws acm request-certificate \
  --domain-name tláo.com \
  --subject-alternative-names www.tláo.com \
  --validation-method DNS \
  --region us-east-1
```

### Step 3: Deploy CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name tlao-redirect \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1 \
  --parameters \
    ParameterKey=DomainName,ParameterValue=tláo.com \
    ParameterKey=TargetDomain,ParameterValue=lstech-solutions.github.io \
    ParameterKey=TargetPath,ParameterValue=/aws-tlao/ \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
```

### Step 4: Configure DNS

Add the following records to your DNS:

| Type  | Name         | Value                                      |
| ----- | ------------ | ------------------------------------------ |
| A     | tláo.com     | CloudFront Distribution Domain Name        |
| AAAA  | tláo.com     | CloudFront Distribution Domain Name (IPv6) |
| CNAME | www.tláo.com | tláo.com                                   |

## Files

- `cloudformation.yaml` - CloudFormation template for the infrastructure
- `setup.sh` - Automated setup script
- `route53-changes.json` - Route 53 DNS change batch file

## Cost Estimation

- **S3**: ~$0.50/month (minimal storage)
- **CloudFront**: ~$1-5/month (depends on traffic)
- **ACM**: Free
- **Route 53**: ~$0.50/month (DNS queries)

**Total: ~$2-6/month**

## Troubleshooting

### Certificate validation pending

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --region us-east-1
```

Check the `DomainValidationOptions` for the required DNS records.

### CloudFront returning 403

Check that the S3 bucket policy allows access from CloudFront:

```json
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tláo.com/*"
    }
  ]
}
```

### Redirect not working

1. Check CloudFront distribution status (should be "Deployed")
2. Verify DNS records are correct
3. Test with: `curl -I https://tláo.com`

## Security

- HTTPS is enforced (redirect-to-https)
- S3 bucket is not publicly accessible
- CloudFront OAI restricts origin access
- Minimal permissions principle applied

## Maintenance

- **SSL Certificate**: Auto-renews (if DNS validation remains valid)
- **CloudFront**: No maintenance required
- **S3**: No maintenance required

## Support

For issues with this setup:

1. Check AWS CloudWatch logs
2. Verify AWS service health
3. Review AWS documentation for specific services
