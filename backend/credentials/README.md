# Credentials Directory

This directory stores sensitive credential files for external services.

## Files (DO NOT COMMIT!)

- `google-vision-key.json` - Google Cloud Vision API service account key

## Setup

See: `backend/docs/GCP-VISION-SETUP.md`

## Security

- All `*.json` files are in `.gitignore`
- Never commit credentials to git
- Never share credentials in Slack/Email
- Rotate keys regularly (every 6 months)

## Production

In production, use environment variables or secret managers:
- Google Secret Manager
- AWS Secrets Manager
- Azure Key Vault
