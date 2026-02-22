#!/bin/zsh
# Script to create or update the ZeroInbox SES custom verification email template using environment variables from .env

# Load environment variables from .env
set -a
source "$(dirname "$0")/../.env"
set +a

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_REGION

aws ses create-custom-verification-email-template \
  --region "$AWS_REGION" \
  --template-name ZeroInboxVerificationTemplate \
  --from-email-address "verification@zeroinbox.ai" \
  --template-subject "Verify your email for ZeroInbox" \
  --template-content file://$(dirname "$0")/verification_template.html \
  --success-redirection-url "https://app.zeroinbox.ai/login" \
  --failure-redirection-url "https://app.zeroinbox.ai/login" \
  || aws ses update-custom-verification-email-template \
  --region "$AWS_REGION" \
  --template-name ZeroInboxVerificationTemplate \
  --from-email-address "verification@zeroinbox.ai" \
  --template-subject "Verify your email for ZeroInbox" \
  --template-content file://$(dirname "$0")/verification_template.html \
  --success-redirection-url "https://app.zeroinbox.ai/login" \
  --failure-redirection-url "https://app.zeroinbox.ai/login"
