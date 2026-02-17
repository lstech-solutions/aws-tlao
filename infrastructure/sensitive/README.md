# Sensitive Configuration Files

This directory contains sensitive configuration files that should NOT be committed to git.

## Files in this directory

- `config.yaml` - Your actual configuration (git-ignored)
- `config.example.yaml` - Example configuration template (committed)
- `secrets.yaml` - Additional secrets if needed (git-ignored)
- `.gitkeep` - Keeps the directory in git (committed)

## Setup

1. Copy the example configuration:
   ```bash
   cp config.example.yaml config.yaml
   ```

2. Edit `config.yaml` with your actual values:
   ```bash
   nano config.yaml
   # or
   vim config.yaml
   ```

3. Fill in all required values:
   - AWS Account ID
   - Route53 Hosted Zone ID
   - Email forwarding mappings
   - Any other sensitive information

## Security Notes

- **NEVER** commit `config.yaml` to git
- **NEVER** share `config.yaml` publicly
- Use AWS Secrets Manager or Parameter Store for production secrets
- Rotate credentials regularly
- Use IAM roles instead of access keys when possible

## Verification

Check that your config file is properly ignored:
```bash
git status
# config.yaml should NOT appear in the list
```

## Backup

Keep a secure backup of your configuration:
```bash
# Encrypt and backup
gpg -c config.yaml
# This creates config.yaml.gpg which you can store securely
```
