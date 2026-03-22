#!/usr/bin/env bash
# Creates/updates CodePipelines for the email system.
# Gated by APPROVE=true to prevent accidental mutations.
set -euo pipefail

STAGE="${STAGE:-production}"
REGION="${AWS_REGION:-us-east-2}"

if [ "${APPROVE:-false}" != "true" ]; then
  echo "Pipeline creation requires explicit approval."
  echo "Re-run with: APPROVE=true bash scripts/ensure-pipelines.sh"
  exit 1
fi

echo "Creating/updating email pipelines for stage: $STAGE"

INFRA_CREATE_PIPELINES=true \
  AWS_REGION="$REGION" \
  npx sst deploy --stage "$STAGE"

echo "Pipelines provisioned."
