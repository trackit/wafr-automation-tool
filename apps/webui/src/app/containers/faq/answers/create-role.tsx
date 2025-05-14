const CreateRoleAnswer = () => (
  <div className="space-y-6">
    <p>
      First, you need to create a policy that grants the tool access to your AWS
      account:
    </p>
    <ul className="list-disc pl-6 text-gray-700 space-y-2">
      <li>
        Navigate to the <strong>IAM Dashboard</strong> and select{' '}
        <strong>"Policies"</strong>.
      </li>
      <li>
        Click on <strong>"Create policy"</strong> and switch to the{' '}
        <strong>"JSON"</strong> tab.
      </li>
      <li>
        Copy and paste the following policy into the JSON editor:
        <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
          <code>
            {`{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": [
				"account:Get*",
				"aoss:ListCollections",
				"appstream:Describe*",
				"appstream:List*",
				"auditmanager:GetSettings",
				"backup:List*",
				"backup:Get*",
				"bedrock:List*",
				"bedrock:Get*",
				"cloudtrail:GetInsightSelectors",
				"codeartifact:List*",
				"codebuild:BatchGet*",
				"codebuild:ListReportGroups",
				"cognito-idp:GetUserPoolMfaConfig",
				"compute-optimizer:GetRecommendationSummaries",
				"devops-guru:ListNotificationChannels",
				"dlm:Get*",
				"drs:Describe*",
				"ds:Get*",
				"ds:Describe*",
				"ds:List*",
				"dynamodb:GetResourcePolicy",
				"ec2:GetEbsDefaultKmsKeyId",
				"ec2:GetEbsEncryptionByDefault",
				"ec2:GetSnapshotBlockPublicAccessState",
				"ec2:GetInstanceMetadataDefaults",
				"ecr:Describe*",
				"ecr:GetRegistryScanningConfiguration",
				"elasticfilesystem:DescribeBackupPolicy",
				"forecast:ListForecastExportJobs",
				"geo:ListGeofenceCollections",
				"geo:DescribeGeofenceCollection",
				"geo:ListTrackers",
				"geo:DescribeTracker",
				"glue:GetConnections",
				"glue:GetSecurityConfiguration*",
				"glue:SearchTables",
				"glue:GetMLTransforms",
				"iotsitewise:DescribeDefaultEncryptionConfiguration",
				"lambda:GetFunction*",
				"logs:FilterLogEvents",
				"lightsail:GetRelationalDatabases",
				"macie2:GetMacieSession",
				"macie2:GetAutomatedDiscoveryConfiguration",
				"proton:ListEnvironmentTemplates",
				"proton:GetEnvironmentTemplate",
				"s3:GetAccountPublicAccessBlock",
				"shield:DescribeProtection",
				"shield:GetSubscriptionState",
				"securityhub:BatchImportFindings",
				"securityhub:GetFindings",
				"servicecatalog:Describe*",
				"servicecatalog:List*",
				"ssm:GetDocument",
				"ssm-incidents:List*",
				"states:ListTagsForResource",
				"support:Describe*",
				"tag:GetTagKeys",
				"timestream:DescribeEndpoints",
				"timestream:ListDatabases",
				"voiceid:ListDomains",
				"wellarchitected:List*",
				"wisdom:ListAssistants"d
			],
			"Resource": "*",
			"Effect": "Allow",
			"Sid": "AllowMoreReadOnly"
		},
		{
			"Action": [
				"apigateway:GET"
			],
			"Resource": [
				"arn:aws:apigateway:*::*/restapis/*",
				"arn:aws:apigateway:*::*/apis/*"
			],
			"Effect": "Allow",
			"Sid": "AllowAPIGatewayReadOnly"
		}
	]
}`}
          </code>
        </pre>
      </li>
      <li>
        Add a <strong>"Name"</strong> and <strong>"Description"</strong> to the
        policy. It will be used to add the policy to the role.
      </li>
    </ul>
    <p>Create the remote role in AWS by following these steps:</p>
    <ul className="list-decimal pl-6 text-gray-700 space-y-2">
      <li>
        Navigate to the <strong>IAM Dashboard</strong> and select{' '}
        <strong>"Roles"</strong>.
      </li>
      <li className="space-y-2">
        <p>
          Click on <strong>"Create role"</strong> and choose{' '}
          <strong>"Remote access"</strong> for remote access with the following
          trust policy:
        </p>
        <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
          <code>
            {`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "ACCOUNT_ID"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`}
          </code>
        </pre>
        <p className="text-gray-700">
          Replace <strong>ACCOUNT_ID</strong> with the account ID where the tool
          is deployed.
        </p>
      </li>
      <li className="space-y-2">
        <p>
          Add your <strong>previously created policy</strong> to the role and
          the following policies:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <strong>SecurityAudit</strong>
          </li>
          <li>
            <strong>job-function/ViewOnlyAccess</strong>
          </li>
        </ul>
      </li>
      <li>Complete the setup by naming the role.</li>
    </ul>
    <p>
      Once created, you can use the role ARN to perform an assessment on this
      specific AWS account.
    </p>
  </div>
);

export default CreateRoleAnswer;
