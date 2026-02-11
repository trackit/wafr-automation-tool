#!/bin/sh

PARAMS="Owner=\"$STAGE\" Debug=\"$DEBUG\" InitialUserEmail=\"$INITIAL_USER_EMAIL\" LogRetentionInDays=\"$LOG_RETENTION_IN_DAYS\" GenAIMaxRetries=\"$GEN_AI_MAX_RETRIES\" AIFindingsAssociationChunkSize=\"$AI_FINDINGS_ASSOCIATION_CHUNK_SIZE\" SlackWorkspaceId=\"$SLACK_WORKSPACE_ID\" SlackChannelId=\"$SLACK_CHANNEL_ID\""

if [ -n "$UNIT_BASED_PRICING_PRODUCT_CODE" ]; then
  PARAMS="$PARAMS UnitBasedPricingProductCode=\"$UNIT_BASED_PRICING_PRODUCT_CODE\""
fi

if [ -n "$MONTHLY_SUBSCRIPTION_PRODUCT_CODE" ]; then
  PARAMS="$PARAMS MonthlySubscriptionProductCode=\"$MONTHLY_SUBSCRIPTION_PRODUCT_CODE\""
fi

sam deploy \
  --stack-name="wafr-automation-tool-$STAGE" \
  --s3-prefix="wafr-automation-tool-$STAGE" \
  --tags Project=wafr-automation-tool Owner="$STAGE" Name="wafr-automation-tool-$STAGE" \
  --parameter-overrides $PARAMS \
  --no-fail-on-empty-changeset \
  $@
