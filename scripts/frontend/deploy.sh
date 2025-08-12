#!/usr/bash

stack_outputs=$(sam list stack-outputs --stack-name="wafr-automation-tool-$STAGE" --output json)
bucket=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="CloudFrontS3BucketName") | .OutputValue')
distribution_id=$(echo "$stack_outputs" | jq -r -c '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')

aws s3 sync ./dist/webui "s3://${bucket}/" --delete --exclude "cloudformation-templates/*"
aws cloudfront create-invalidation --distribution-id "${distribution_id}" --paths "/*" --no-cli-pager
