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
      - [Create assessment export role](#create-assessment-export-role)
        - [Local](#local)
        - [Remote](#remote)
      - [Create organization](#create-organization)
      - [Create a custom mapping](#create-a-custom-mapping)
      - [Create your prompt](#create-your-prompt)
  - [Usage](#usage)
    - [Requirements](#requirements)
    - [Local](#local-1)
    - [Remote](#remote-1)

## Overview

This AWS serverless backend offers a scalable and maintainable solution integrating API Gateway and Lambda functions to handle user requests.
AWS Step Functions orchestrate the execution of ECS tools including Cloud Custodian, Prowler, and CloudSploit.

The results produced by these tools are stored in Amazon S3 and DynamoDB, then analyzed using our manual mapping and Amazon Bedrock (LLM) to automatically map findings against AWS Well-Architected Framework Review (WAFR) best practices. This enables precise correlation of security and compliance findings with best practices, which can then be presented on the frontend interface.

## Getting started

### Tests

To run backend tests locally, we need to start the local dynamodb container, initialize the tables and then we can execute the tests.

```shell
$ docker-compose up -d
$ npm run test:backend:init
$ npm run test:backend
```

## Deployment

### Environment Variables

These environment variables need to be set for the backend to be deployed.

| Variable             | Description                                                                                                                | Example                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `STAGE`              | Defines the target deployment environment or context                                                                       | `dev` or `prod`                                   |
| `DEBUG`              | Enable or disable debug mode (`true` or `false`)                                                                           | `false`                                           |
| `REPOSITORY`         | URL of the backend repository                                                                                              | `https://github.com/trackit/wafr-automation-tool` |
| `INITIAL_USER_EMAIL` | Email of the initial user created in the frontend. An email will be sent to this address containing the frontend password. | `example@example.com`                             |

### Deployment Command

Deploy the backend using [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html#serverless-sam-cli-using-package-and-deploy) through:

```shell
$ npm run deploy:backend
```

### Post deployment

#### Create assessment export role

##### Local

The role will be created automatically during the deployment, you don't need to create it. You can find it in the IAM roles under the name "wafr-automation-tool-${STAGE}-AssessmentExportRole."

##### Remote

In order to export assessments on an other account, you must create a new role in the target account with the following managed policy:

- WellArchitectedConsoleFullAccess

And with the following [Trust Policy](../webui/src/assets/trust-policy-scan.json), where you need to replace:

- `<ACCOUNT_ID>` with the AWS account ID where the tool is deployed
- `<ENV>` with the stage name (e.g., `prod`, `staging`)

#### Create organization

You must create a new organization in your DynamoDB table named 'wafr-automation-tool-${STAGE}-organization'. Here is the template:

| Key                       | Type   | Value                                                                                                         |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `PK`                      | String | Email domain of the organization                                                                              |
| `domain`                  | String | Email domain of the organization                                                                              |
| `assessmentExportRoleArn` | String | Arn of the role that will be used to export. [Create assessment export role.](#create-assessment-export-role) |

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

In both cases, a complete analysis takes a long time, depending on the size of the account.

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
