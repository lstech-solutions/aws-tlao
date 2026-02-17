# Post-Deployment Configuration

After running the deployment script, follow these steps to complete the setup.

## 1. Configure Route53 DNS

### Get CloudFront Domain Name

```bash
aws cloudformation describe-stacks \
  --stack-name tlao-domain-redirect \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text \
  --region us-east-1
```

### Add DNS Records

Go to Route53 Console and add these records for `xn--tlo-6ma.com`:

#### A Record (Alias) for apex domain

- **Name**: `xn--tlo-6ma.com`
- **Type**: `A`
- **Alias**: `Yes`
- **Alias Target**: `<CloudFront-Domain-Name>` (from above)
- **Routing Policy**: Simple

#### A Record (Alias) for www

- **Name**: `www.xn--tlo-6ma.com`
- **Type**: `A`
- **Alias**: `Yes`
- **Alias Target**: `<CloudFront-Domain-Name>` (from above)
- **Routing Policy**: Simple

#### MX Record for email

- **Name**: `xn--tlo-6ma.com`
- **Type**: `MX`
- **Value**: `10 inbound-smtp.us-east-1.amazonaws.com`
- **TTL**: `300`

## 2. Validate ACM Certificate

1. Go to **ACM Console** (us-east-1 region)
2. Find the certificate for `xn--tlo-6ma.com`
3. Click on the certificate
4. Copy the **CNAME name** and **CNAME value** for validation
5. Add these as CNAME records in Route53
6. Wait for validation (can take up to 30 minutes)

## 3. Verify Domain in SES

1. Go to **SES Console** → **Verified identities**
2. Click **Create identity** → **Domain**
3. Enter `xn--tlo-6ma.com`
4. Enable **DKIM** signing
5. Copy all DNS records provided
6. Add them to Route53:
   - DKIM CNAME records (3 records)
   - Domain verification TXT record
7. Wait for verification (can take up to 72 hours, usually minutes)

## 4. Activate SES Receipt Rule Set

```bash
aws ses set-active-receipt-rule-set \
  --rule-set-name xn--tlo-6ma.com-ruleset \
  --region us-east-1
```

## 5. Verify Destination Emails

For each destination email (e.g., admin@lstech.solutions):

```bash
aws ses verify-email-identity \
  --email-address admin@lstech.solutions \
  --region us-east-1
```

Check the inbox and click the verification link.

## 6. Request SES Production Access

If your SES account is in sandbox mode:

1. Go to **SES Console** → **Account dashboard**
2. Click **Request production access**
3. Fill out the form:
   - **Mail type**: Transactional
   - **Website URL**: https://tláo.com
   - **Use case description**:
     ```
     Email forwarding service for tláo.com domain.
     Forwarding incoming emails to internal team addresses.
     Expected volume: <100 emails/day
     ```
4. Submit and wait for approval (usually 24-48 hours)

## 7. Test the Setup

### Test Domain Redirect

```bash
curl -I https://tláo.com
# or
curl -I https://xn--tlo-6ma.com
```

Expected: HTTP 301/302 redirect to GitHub Pages

### Test Email Forwarding

1. Send a test email to `admin@tláo.com`
2. Check `admin@lstech.solutions` inbox
3. You should receive the forwarded email

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/xn--tlo-6ma.com-email-forwarder --follow --region us-east-1
```

## Troubleshooting

### Domain not redirecting

1. Check CloudFront distribution status:

   ```bash
   aws cloudfront get-distribution --id <distribution-id> --query 'Distribution.Status'
   ```

   Must be "Deployed"

2. Verify DNS records in Route53
3. Check ACM certificate status (must be "Issued")
4. Clear browser cache or test in incognito mode

### Emails not forwarding

1. Check SES receipt rule set is active:

   ```bash
   aws ses describe-active-receipt-rule-set --region us-east-1
   ```

2. Verify domain in SES:

   ```bash
   aws ses get-identity-verification-attributes \
     --identities xn--tlo-6ma.com \
     --region us-east-1
   ```

3. Check Lambda logs for errors
4. Verify destination email is verified in SES
5. Check if SES is in sandbox mode

### Certificate validation stuck

1. Verify CNAME records are added to Route53
2. Wait up to 30 minutes for DNS propagation
3. Check ACM console for validation status
4. Ensure CNAME records match exactly (including trailing dots)

## Monitoring

### CloudWatch Alarms

Set up alarms for:

- Lambda errors
- SES bounces
- CloudFront 4xx/5xx errors

### Cost Monitoring

Set up billing alerts:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name tlao-monthly-cost \
  --alarm-description "Alert when monthly cost exceeds $20" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold
```

## Next Steps

- Set up CloudWatch dashboards
- Configure SNS notifications for alerts
- Document runbooks for common issues
- Schedule regular reviews of email forwarding rules
