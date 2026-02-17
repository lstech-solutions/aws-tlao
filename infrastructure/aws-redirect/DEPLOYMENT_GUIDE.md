# AWS Redirect Deployment Guide for tláo.com

## Overview

This guide explains how to deploy the AWS infrastructure to redirect `tláo.com` to `lstech-solutions.github.io/aws-tlao/`.

## Prerequisites

1. **AWS Account** with permissions to:
   - Create S3 buckets
   - Create CloudFront distributions
   - Request ACM certificates
   - Manage Route 53 hosted zones

2. **Domain Registration**: `tláo.com` must be registered with a domain registrar

3. **AWS CLI** installed and configured

## Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1 recommended)
# - Default output format (json)
```

## Step 2: Prepare the Domain

1. **Create Route 53 Hosted Zone** (if not already created):

   ```bash
   aws route53 create-hosted-zone --name tláo.com --caller-reference $(date +%s)
   ```

2. **Update DNS Nameservers** at your domain registrar:
   - Get the nameservers from the hosted zone:
     ```bash
     aws route53 get-hosted-zone --id YOUR_HOSTED_ZONE_ID
     ```
   - Update your domain registrar with these nameservers

## Step 3: Deploy the Infrastructure

Run the setup script:

```bash
cd infrastructure/aws-redirect
chmod +x setup.sh
./setup.sh
```

The script will:

1. Request an SSL certificate for `tláo.com` and `www.tláo.com`
2. Deploy CloudFormation stack with S3 + CloudFront + Route 53
3. Provide DNS records to add

## Step 4: Complete DNS Validation

1. **SSL Certificate Validation**:
   - The script will output CNAME records for SSL validation
   - Add these to your DNS provider
   - Wait for certificate issuance (check with `aws acm describe-certificate`)

2. **DNS Records**:
   - Add the A and CNAME records provided by the script
   - Wait for DNS propagation (up to 48 hours)

## Step 5: Test the Redirect

After DNS propagation:

- Visit `https://tláo.com` - should redirect to `https://lstech-solutions.github.io/aws-tlao/`
- Visit `https://www.tláo.com` - should redirect to `https://tláo.com`

## Alternative: Manual Deployment

If the script doesn't work, deploy manually:

```bash
# 1. Request SSL certificate
aws acm request-certificate \
  --domain-name "tláo.com" \
  --subject-alternative-names "www.tláo.com" \
  --validation-method DNS \
  --region us-east-1

# 2. Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name tlao-redirect \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1 \
  --parameters \
    ParameterKey=DomainName,ParameterValue="tláo.com" \
    ParameterKey=TargetDomain,ParameterValue="lstech-solutions.github.io" \
    ParameterKey=TargetPath,ParameterValue="/aws-tlao/" \
    ParameterKey=CertificateArn,ParameterValue="YOUR_CERTIFICATE_ARN"

# 3. Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name tlao-redirect \
  --region us-east-1
```

## Troubleshooting

### Common Issues

1. **Certificate not issued**: Complete DNS validation CNAME records
2. **DNS not propagating**: Wait 24-48 hours, check with `dig tláo.com`
3. **CloudFront distribution not ready**: Wait 15-30 minutes after creation
4. **S3 bucket name conflict**: `tláo.com` bucket might already exist

### Verification Commands

```bash
# Check CloudFormation status
aws cloudformation describe-stacks --stack-name tlao-redirect

# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test redirect (after DNS propagation)
curl -I https://tláo.com
```

## Cost Estimation

- **Route 53**: $0.50/month per hosted zone
- **CloudFront**: ~$0.085/GB data transfer (first 10TB free tier)
- **S3**: Minimal cost for redirect bucket
- **ACM Certificate**: Free

Total estimated cost: < $1/month for low traffic

## Cleanup

To remove all resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name tlao-redirect --region us-east-1

# Delete SSL certificate (if no longer needed)
aws acm delete-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1

# Delete Route 53 hosted zone (if created)
aws route53 delete-hosted-zone --id YOUR_HOSTED_ZONE_ID
```

## Notes

- The redirect preserves HTTPS and handles both `tláo.com` and `www.tláo.com`
- CloudFront provides global CDN and SSL termination
- S3 bucket is configured for website redirect only
- Route 53 manages DNS with proper aliasing to CloudFront
