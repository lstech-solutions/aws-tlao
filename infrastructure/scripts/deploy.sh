#!/bin/bash

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$INFRA_DIR/sensitive/config.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TLÁO.COM Infrastructure Deployment ===${NC}"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file not found${NC}"
    echo "Please create $CONFIG_FILE from the example:"
    echo "  cp $INFRA_DIR/sensitive/config.example.yaml $CONFIG_FILE"
    echo "  nano $CONFIG_FILE"
    exit 1
fi

# Function to read YAML config (simple parser)
get_config() {
    local key=$1
    grep "^$key:" "$CONFIG_FILE" | sed 's/.*: *"\?\([^"]*\)"\?/\1/' | tr -d '"'
}

# Load configuration
DOMAIN_NAME=$(get_config "name")
TARGET_URL=$(get_config "target_url")
AWS_REGION=$(get_config "region")
DOMAIN_STACK=$(get_config "domain_redirect")
EMAIL_STACK=$(get_config "email_forwarding")

# Validate configuration
if [ -z "$DOMAIN_NAME" ] || [ -z "$AWS_REGION" ]; then
    echo -e "${RED}Error: Invalid configuration file${NC}"
    echo "Please check $CONFIG_FILE"
    exit 1
fi

echo "Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  Region: $AWS_REGION"
echo "  Target: $TARGET_URL"
echo ""

# Parse email forwarding mappings from config
FORWARDING_MAPPINGS=""
while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*\"(.+)\":[[:space:]]*\"(.+)\" ]]; then
        from="${BASH_REMATCH[1]}"
        to="${BASH_REMATCH[2]}"
        if [ -z "$FORWARDING_MAPPINGS" ]; then
            FORWARDING_MAPPINGS="$from=$to"
        else
            FORWARDING_MAPPINGS="$FORWARDING_MAPPINGS,$from=$to"
        fi
    fi
done < <(sed -n '/forwarding:/,/from_email:/p' "$CONFIG_FILE" | grep -E '^\s+".*":\s+".*"')

if [ -z "$FORWARDING_MAPPINGS" ]; then
    echo -e "${YELLOW}Warning: No email forwarding mappings found in config${NC}"
fi

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name "$1" --region "$AWS_REGION" &>/dev/null
}

# Function to wait for stack
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo -e "${YELLOW}Waiting for stack ${operation}...${NC}"
    aws cloudformation wait "stack-${operation}-complete" \
        --stack-name "$stack_name" \
        --region "$AWS_REGION"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Stack ${operation} completed successfully${NC}"
    else
        echo -e "${RED}✗ Stack ${operation} failed${NC}"
        exit 1
    fi
}

# Deploy Domain Redirect Stack
echo -e "${BLUE}Step 1: Deploying Domain Redirect Stack${NC}"
echo "This will create:"
echo "  - S3 bucket for redirect"
echo "  - CloudFront distribution"
echo "  - ACM certificate"
echo ""

if stack_exists "$DOMAIN_STACK"; then
    echo "Stack exists, updating..."
    aws cloudformation update-stack \
        --stack-name "$DOMAIN_STACK" \
        --template-body file://"$INFRA_DIR/cloudformation/domain-redirect.yaml" \
        --parameters \
            ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
            ParameterKey=TargetURL,ParameterValue="$TARGET_URL" \
        --region "$AWS_REGION" \
        --capabilities CAPABILITY_NAMED_IAM 2>&1 | grep -v "No updates are to be performed" || echo "No updates needed"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        wait_for_stack "$DOMAIN_STACK" "update"
    fi
else
    echo "Creating new stack..."
    aws cloudformation create-stack \
        --stack-name "$DOMAIN_STACK" \
        --template-body file://"$INFRA_DIR/cloudformation/domain-redirect.yaml" \
        --parameters \
            ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
            ParameterKey=TargetURL,ParameterValue="$TARGET_URL" \
        --region "$AWS_REGION" \
        --capabilities CAPABILITY_NAMED_IAM
    
    wait_for_stack "$DOMAIN_STACK" "create"
fi

echo ""
echo -e "${BLUE}Step 2: Deploying Email Forwarding Stack${NC}"
echo "This will create:"
echo "  - S3 bucket for email storage"
echo "  - Lambda function for forwarding"
echo "  - SES receipt rules"
echo ""

if [ -z "$FORWARDING_MAPPINGS" ]; then
    echo -e "${YELLOW}Skipping email forwarding (no mappings configured)${NC}"
else
    if stack_exists "$EMAIL_STACK"; then
        echo "Stack exists, updating..."
        aws cloudformation update-stack \
            --stack-name "$EMAIL_STACK" \
            --template-body file://"$INFRA_DIR/cloudformation/email-forwarding.yaml" \
            --parameters \
                ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                ParameterKey=ForwardingMappings,ParameterValue="$FORWARDING_MAPPINGS" \
            --region "$AWS_REGION" \
            --capabilities CAPABILITY_NAMED_IAM 2>&1 | grep -v "No updates are to be performed" || echo "No updates needed"
        
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            wait_for_stack "$EMAIL_STACK" "update"
        fi
    else
        echo "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name "$EMAIL_STACK" \
            --template-body file://"$INFRA_DIR/cloudformation/email-forwarding.yaml" \
            --parameters \
                ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                ParameterKey=ForwardingMappings,ParameterValue="$FORWARDING_MAPPINGS" \
            --region "$AWS_REGION" \
            --capabilities CAPABILITY_NAMED_IAM
        
        wait_for_stack "$EMAIL_STACK" "create"
    fi
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Get CloudFront domain name:"
echo "   aws cloudformation describe-stacks --stack-name $DOMAIN_STACK --query 'Stacks[0].Outputs[?OutputKey==\`CloudFrontDomainName\`].OutputValue' --output text --region $AWS_REGION"
echo ""
echo "2. Configure Route53 DNS (see infrastructure/docs/dns-setup.md)"
echo ""
echo "3. Verify ACM certificate (check ACM Console)"
echo ""
echo "4. Verify domain in SES (check SES Console)"
echo ""
echo "5. Activate SES receipt rule set:"
echo "   aws ses set-active-receipt-rule-set --rule-set-name ${DOMAIN_NAME}-ruleset --region $AWS_REGION"
echo ""
echo "6. Verify destination emails in SES"
echo ""
echo "For detailed instructions, see: infrastructure/docs/post-deployment.md"
echo ""
