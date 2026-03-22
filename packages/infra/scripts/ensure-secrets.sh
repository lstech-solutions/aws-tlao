#!/usr/bin/env bash
# Ensures required SSM parameters exist before deploying.
# Run once per account/region during initial setup.
set -euo pipefail

STAGE="${STAGE:-dev}"
REGION="${AWS_REGION:-us-east-2}"

required_params=(
  "/tlao/email/codestar-connection-arn"
)

echo "Checking SSM parameters for stage: $STAGE in $REGION"

missing=()
for param in "${required_params[@]}"; do
  if ! aws ssm get-parameter --name "$param" --region "$REGION" --query "Parameter.Name" --output text 2>/dev/null; then
    missing+=("$param")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo ""
  echo "ERROR: Missing required SSM parameters:"
  for p in "${missing[@]}"; do
    echo "  $p"
  done
  echo ""
  echo "Set them with:"
  echo "  aws ssm put-parameter --name /tlao/email/codestar-connection-arn \\"
  echo "    --value 'arn:aws:codestar-connections:...' \\"
  echo "    --type SecureString --region $REGION"
  exit 1
fi

echo "All required SSM parameters present."
