#!/bin/bash

if [ -z "$1" ]; then
  configuration_name="development"
else
  configuration_name=$1
fi

account_id=$(aws sts get-caller-identity --query Account --output text)
stack_outputs=$(sam list stack-outputs --stack-name="wafr-automation-tool-$STAGE" --output json)
cognito_user_pool_id=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
cognito_user_pool_client_id=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')
cognito_identity_pool_id=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="CognitoIdentityPoolId") | .OutputValue')
api_endpoint=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')

aws_region=$(aws configure list | grep region | awk '{print $2}')

{
  echo "VITE_ACCOUNT_ID=$account_id"
  echo "VITE_STAGE=$STAGE"
  echo "VITE_API_URL=$api_endpoint"
  echo "VITE_AWS_REGION=$aws_region"
  echo "VITE_USER_POOL_ID=$cognito_user_pool_id"
  echo "VITE_APP_CLIENT_ID=$cognito_user_pool_client_id"
  echo "VITE_IDENTITY_POOL_ID=$cognito_identity_pool_id"
} > apps/webui/.env.$configuration_name
