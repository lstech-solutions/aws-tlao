#!/bin/bash

# Get the current CloudFront distribution config
CONFIG=$(aws cloudfront get-distribution-config --id EKJYIC9UXK8KB --region us-east-1)

# Extract the ETag
ETAG=$(echo "$CONFIG" | jq -r '.ETag')

# Get the distribution config
DIST_CONFIG=$(echo "$CONFIG" | jq '.DistributionConfig')

# Update the domain name to use S3 website endpoint
UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq '.Origins.Items[0].DomainName = "tlao-redirect-058264267235-final.s3-website-us-east-1.amazonaws.com"')

# Create temp file with updated config
echo "$UPDATED_CONFIG" > /tmp/cloudfront-config.json

# Update the distribution
aws cloudfront update-distribution \
  --id EKJYIC9UXK8KB \
  --region us-east-1 \
  --distribution-config file:///tmp/cloudfront-config.json \
  --if-match "$ETAG"

echo "CloudFront distribution update initiated. It may take 15-30 minutes to deploy."