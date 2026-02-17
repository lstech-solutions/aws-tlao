#!/bin/bash

# AWS Redirect Setup Script for tláo.com
# This script sets up the infrastructure to redirect tláo.com to lstech-solutions.github.io/aws-tlao/

set -e

echo "🚀 AWS Redirect Setup for tláo.com"
echo "=================================="
echo ""

# Configuration
DOMAIN_NAME="tláo.com"
TARGET_DOMAIN="lstech-solutions.github.io"
TARGET_PATH="/aws-tlao/"
AWS_REGION="us-east-1"
STACK_NAME="tlao-redirect"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo "📋 AWS Account ID: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Request SSL Certificate
echo "📜 Step 1: Requesting SSL Certificate for $DOMAIN_NAME"
echo "--------------------------------------------------------"

echo "   Requesting certificate in $AWS_REGION..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --subject-alternative-names "www.$DOMAIN_NAME" \
    --validation-method DNS \
    --region "$AWS_REGION" \
    --query 'CertificateArn' \
    --output text)

echo -e "${GREEN}✅ Certificate requested: $CERT_ARN${NC}"
echo ""
echo "⚠️  IMPORTANT: You need to complete DNS validation!"
echo "   Check the certificate status with:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION"
echo ""
echo "   You'll need to add CNAME records to your DNS for validation."
echo ""

# Step 2: Deploy CloudFormation Stack
echo "🏗️  Step 2: Deploying CloudFormation Stack"
echo "------------------------------------------"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "   Stack exists, updating..."
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation.yaml \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION" \
        --parameters \
            ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
            ParameterKey=TargetDomain,ParameterValue="$TARGET_DOMAIN" \
            ParameterKey=TargetPath,ParameterValue="$TARGET_PATH" \
            ParameterKey=CertificateArn,ParameterValue="$CERT_ARN"
    
    echo -e "${GREEN}✅ Stack update initiated${NC}"
else
    echo "   Creating new stack..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation.yaml \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION" \
        --parameters \
            ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
            ParameterKey=TargetDomain,ParameterValue="$TARGET_DOMAIN" \
            ParameterKey=TargetPath,ParameterValue="$TARGET_PATH" \
            ParameterKey=CertificateArn,ParameterValue="$CERT_ARN"
    
    echo -e "${GREEN}✅ Stack creation initiated${NC}"
fi

echo ""
echo "⏳ Waiting for stack creation to complete..."
aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" 2>/dev/null || \
aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION"

echo -e "${GREEN}✅ Stack deployment complete${NC}"
echo ""

# Step 3: Get CloudFront Distribution Domain Name
echo "🌐 Step 3: Getting CloudFront Distribution Details"
echo "---------------------------------------------------"

DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
    --output text)

echo "   CloudFront Distribution: $DISTRIBUTION_DOMAIN"
echo ""

# Step 4: DNS Configuration
echo "🔧 Step 4: DNS Configuration"
echo "-----------------------------"
echo ""
echo "   Add the following records to your DNS provider:"
echo ""
echo "   Type    Name          Value"
echo "   ----    ----          -----"
echo "   A       tláo.com       $DISTRIBUTION_DOMAIN"
echo "   AAAA    tláo.com       (CloudFront IPv6 address)"
echo "   CNAME   www.tláo.com   tláo.com"
echo ""

# Get hosted zone ID (if using Route 53)
echo "   If you're using Route 53, run:"
echo "   aws route53 change-resource-record-sets \\"
echo "       --hosted-zone-id YOUR_ZONE_ID \\"
echo "       --change-batch file://route53-changes.json"
echo ""

# Create Route 53 change batch file
cat > route53-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "$DISTRIBUTION_DOMAIN",
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": ["$DOMAIN_NAME"]
      }
    }
  ]
}
EOF

echo -e "${GREEN}✅ Created route53-changes.json${NC}"
echo ""

# Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Summary:"
echo "   • SSL Certificate: $CERT_ARN"
echo "   • CloudFront Distribution: $DISTRIBUTION_DOMAIN"
echo "   • Redirect Target: https://$TARGET_DOMAIN$TARGET_PATH"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Complete SSL certificate DNS validation"
echo "   2. Add DNS records to your domain registrar"
echo "   3. Wait for DNS propagation (up to 48 hours)"
echo "   4. Test the redirect: https://$DOMAIN_NAME"
echo ""
echo "📖 For more details, see: infrastructure/aws-redirect/README.md"