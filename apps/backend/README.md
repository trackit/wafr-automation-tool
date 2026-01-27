# Backend <a href="../../README.md" style="float: right; font-size: medium; line-height: 1.5;">Home</a>

![AWS Architecture](../../resources/architecture.png)

## Table of contents

- [Backend Home](#backend-home)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Getting started](#getting-started)
    - [Tests](#tests)
  - [Deployment](#deployment)
    - [Environment Variables](#environment-variables)
    - [Deployment Command](#deployment-command)
    - [Post deployment](#post-deployment)
      - [Migration Runner](#migration-runner)
      - [Create assessment export role](#create-assessment-export-role)
        - [Local](#local)
        - [Remote](#remote)
      - [ACE Integration](#ace-integration)
        - [Role](#role)
          - [Local](#local-1)
          - [Remote](#remote-1)
        - [Solutions](#solutions)
        - [OpportunityTeamMembers](#opportunityteammembers)
      - [Create organization](#create-organization)
      - [Create a custom mapping](#create-a-custom-mapping)
      - [Create your prompt](#create-your-prompt)
  - [Usage](#usage)
    - [Requirements](#requirements)
    - [Local](#local-2)
    - [Remote](#remote-2)

## Overview

This AWS serverless backend offers a scalable and maintainable solution integrating API Gateway and Lambda functions to handle user requests.
AWS Step Functions orchestrate the execution of ECS tools including Cloud Custodian, Prowler, and CloudSploit.

The results produced by these tools are stored in Amazon S3 and Amazon Aurora, then analyzed using a manual mapping and Amazon Bedrock (LLM) to automatically map findings against AWS Well-Architected Framework Review (WAFR) best practices. This enables precise correlation of security and compliance findings with best practices, which can then be presented on the frontend interface.

## Getting started

### Tests

To run backend tests locally, we rely on testContainers, which dynamically start isolated database containers at runtime. This removes the need for a locally running PostgreSQL instance or manual Docker Compose setup.

```shell
$ npm run test:backend
```

## Deployment

### Environment Variables

These environment variables need to be set for the backend to be deployed.

| Variable                              | Description                                                                                                                | Example                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `STAGE`                               | Defines the target deployment environment or context                                                                       | `dev` or `prod`                                   |
| `DEBUG`                               | Enable or disable debug mode (`true` or `false`)                                                                           | `false`                                           |
| `REPOSITORY`                          | URL of the backend repository                                                                                              | `https://github.com/trackit/wafr-automation-tool` |
| `INITIAL_USER_EMAIL`                  | Email of the initial user created in the frontend. An email will be sent to this address containing the frontend password. | `example@example.com`                             |
| `LOG_RETENTION_IN_DAYS`               | Number of days to retain CloudWatch logs                                                                                   | `14`                                              |
| `GEN_AI_MAX_RETRIES`                  | Maximum number of retries for GenAI API calls                                                                              | `3`                                               |
| `AI_FINDINGS_ASSOCIATION_CHUNK_SIZE`  | Number of findings to process in each AI association batch                                                                 | `10`                                              |

### Deployment Command

Deploy the backend using [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html#serverless-sam-cli-using-package-and-deploy) through:

```shell
$ pnpm run deploy:backend
```

### Post deployment

#### Migration Runner

The migration runner needs to be executed once at least for the tables in the database to be created.
To do so you can use the MigrationRunner lambda.

```shell
$ aws lambda invoke --function-name="<MIGRATION_RUNNER_LAMBDA_NAME>" /dev/null
```

The `<MIGRATION_RUNNER_LAMBDA_NAME>` is the name of the lambda that you can get on the AWS Console.

#### Create assessment export role

##### Local

The role will be created automatically during the deployment, you don't need to create it. You can find it in the IAM roles under the name "wafr-automation-tool-${STAGE}-AssessmentExportRole."

##### Remote

In order to export assessments on an other account, you must create a new role in the target account with the following managed policy:

- WellArchitectedConsoleFullAccess

And with the following [Trust Policy](../webui/src/assets/trust-policy-export.json), where you need to replace:

- `<ACCOUNT_ID>` with the AWS account ID where the tool is deployed
- `<ENV>` with the stage name (e.g., `prod`, `staging`)

#### ACE Integration

Add ACE (Partner Central / ACE Opportunity) integration details in the organization payload using the `aceIntegration` object. This subsection documents the expected fields and requirements.

##### Role

- Field: `aceIntegration.roleArn` (string) — ARN of the IAM role in the target account used to manage opportunities.

###### Local

The role will be created automatically during the deployment, you don't need to create it. You can find it in the IAM roles under the name "wafr-automation-tool-${STAGE}-Api-\*\*\*-DefaultExportRole-\*\*\*\*\*\*\*\*\*\***"

###### Remote

In order to create ACE opportunities on an other account, this role must be created remotely in the target account with the following managed policy :
  `AWSPartnerCentralOpportunityManagement`

And with the following [Trust Policy](../webui/src/assets/trust-policy-ace-opportunity.json), where you need to replace:

- `<ACCOUNT_ID>` with the AWS account ID where the tool is deployed
- `<ENV>` with the stage name (e.g., `prod`, `staging`)

##### Solutions

- Field: `aceIntegration.solutions` (string[])
- Description: array of solution identifiers that the organization plans to associate with opportunities.
- You may specify `"Other"` or leave it as an empty array `[]`.
- Partner-led solutions can be retrieved from AWS Partner Central (APN Console) under:
Partner Central → Solutions → My Solutions
- Example:
  - `"solutions": ["solution-id-1", "solution-id-2"]`

##### OpportunityTeamMembers

- Field: `aceIntegration.opportunityTeamMembers` (array of objects)
- Each object should contain contact details for ACE opportunity team members:
  - `firstName` (string)
  - `lastName` (string)
  - `email` (string)
- Example:
  - `opportunityTeamMembers: [{ "firstName": "Jane", "lastName": "Doe", "email": "jane@org.com" }]`

#### Create organization

You must create the organization related to the account which will interact with the tool.
To do so, you can use the CreateOrganization lambda.

```shell
$ payload=`echo '{ \
  "domain": "domain.com", \
  "name": "Organization Name", \
  "accountId": "999999999999", \
  "assessmentExportRoleArn": "arn:aws:iam::999999999999:role/export-role", \
  "freeAssessmentsLeft": 9999, \
  "aceIntegration": { \
    "roleArn": "arn:aws:iam::999999999999:role/ace-integration-role", \
    "solutions": ["solution-id-1","solution-id-2"], \
    "opportunityTeamMembers": [ \
      { \
        "firstName": "fNamecontact", \
        "lastName": "lNamecontact", \
        "email": "emailcontact@domain.com" \
      } \
    ] \
  } \
}' | openssl base64`
$ aws lambda invoke --function-name="<CREATE_ORGANIZATION_LAMBDA_NAME>" --payload="$payload" /dev/null
```

The `<CREATE_ORGANIZATION_LAMBDA_NAME>` is the name of the lambda that you can get on the AWS Console and the payload values are as follows:

| Key | Type | Value |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `domain` | String | Email domain of the organization |
| `name` | String | Name of the organization |
| `accountId` | String | The id of the account who bought the product |
| `assessmentExportRoleArn` | String | Arn of the role that will be used to export. [Create assessment export role.](#create-assessment-export-role) |
| `freeAssessmentsLeft` | Number | How many free assessments are left |
| `unitBasedAgreementId` | String | The id of the agreement for the unit-based subscription (not mandatory for monthly subscription) |
|`aceIntegration.roleArn` | String | ARN of the ACE integration IAM role in the target customer account |
|`aceIntegration.solutions` | String[] | List of solution IDs from APN Partner Central |
|`aceIntegration.opportunityTeamMembers` | Object[] | Array of team members handling ACE opportunities |
|`aceIntegration.opportunityTeamMembers[].firstName` | String | First name of the team member |
|`aceIntegration.opportunityTeamMembers[].lastName` | String | Last name of the team member |
|`aceIntegration.opportunityTeamMembers[].email` | String | Email of the team member |

#### Create a custom mapping

By default, no mapping will be used and each association will be defined by the AI model. However, you can change this by creating your own mapping, which will allow you to define your own associations and ensure that the findings are associated with the best practices you want. Please note that only Prowler findings can be associated using this method.

To create a custom mapping, you must create a new file named `scan-findings-to-best-practices-mapping.json` in the S3 bucket named `wafr-automation-tool-${STAGE}`. In this file, we associate an event code with several best practices. Here is the template:

```json
{
  "EVENT_CODE": [
    {
      "pillar": "PILLAR_ID",
      "question": "QUESTION_ID",
      "bestPractice": "BEST_PRACTICE_ID"
    }
  ]
}
```

| Key                | Type   | Value                                                                                                                                                                               |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EVENT_CODE`       | String | Event code of the finding.<br>To list all event codes, install [Prowler CLI](https://github.com/toniblyx/prowler#prowler-cli) and run `prowler aws --list-checks` in your terminal. |
| `PILLAR_ID`        | String | Pillar Primary ID for the question. Can be found [here](./../../scripts/questions/questions_05072025.json)                                                                          |
| `QUESTION_ID`      | String | Question Primary ID for the best practice. Can be found [here](./../../scripts/questions/questions_05072025.json)                                                                   |
| `BEST_PRACTICE_ID` | String | Best practice Primary ID. Can be found [here](./../../scripts/questions/questions_05072025.json)                                                                                    |

#### Create your prompt

By default there is no AI model. You need to specify the prompt if you want AI associations to be done.
The prompt is composed of 2 files, one static and one dynamic. The static part is used to cache what's not going to change through the different AI calls, it contains the best practices list, and the dynamic will contain the findings that we want to associate.

You must create the files `static-prompt.txt` and `dynamic-prompt.txt` in the S3 bucket named `wafr-automation-tool-${STAGE}`.
In order for them to be recognized by the system, you must include variables, namely `bestPractices` for the static part and `findings` for the dynamic part. The variables are enclosed by two curly brackets, for instance: `{{bestPractices}}` and `{{findings}}`

## Usage

In both cases, a complete analysis takes a long time, depending on the services used within the account.

### Requirements

- Claude 4 enabled on your AWS account

### Local

To perform a local analysis, you don't need to provide any custom roles or policies.
<br>A default role will be created for you during the deployment.

### Remote

To perform a remote analysis, you must provide a custom role with these managed policies:

- SecurityAudit
- job-function/ViewOnlyAccess

And the following inline policy: [Inline Policy](../webui/src/assets/inline-policy.json)

Additionally, add the following [Trust Policy](../webui/src/assets/trust-policy-scan.json) to your role and replace:

- `<ACCOUNT_ID>` with the AWS account ID where the tool is deployed
- `<ENV>` with the stage name (e.g., `prod`, `staging`)
