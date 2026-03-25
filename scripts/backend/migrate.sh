
echo "Running database migrations..."

STACK_NAME="wafr-automation-tool-$STAGE"

echo "Using stack: $STACK_NAME"

MIGRATION_FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='MigrationRunnerFunctionArn'].OutputValue" \
  --output text)

if [ -z "$MIGRATION_FUNCTION_ARN" ] || [ "$MIGRATION_FUNCTION_ARN" = "None" ]; then
  echo "Warning: MigrationRunnerFunctionArn not found in stack outputs, skipping migrations"
  exit 0
fi

echo "Invoking migration runner: $MIGRATION_FUNCTION_ARN"

RESPONSE_FILE=$(mktemp)

aws lambda invoke \
  --function-name "$MIGRATION_FUNCTION_ARN" \
  --invocation-type RequestResponse \
  --log-type Tail \
  --query 'LogResult' \
  --output text \
  "$RESPONSE_FILE" | base64 --decode

# Check if Lambda returned an error
if grep -q '"errorMessage"' "$RESPONSE_FILE" 2>/dev/null; then
  echo "Migration failed!"
  cat "$RESPONSE_FILE"
  rm -f "$RESPONSE_FILE"
  exit 1
fi

rm -f "$RESPONSE_FILE"
echo "Migrations completed successfully"