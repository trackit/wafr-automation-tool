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
  - [Usage](#usage)
    - [Requirements](#requirements)
    - [Local](#local)
    - [Remote](#remote)

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

## Usage

In both cases, a complete analysis takes a long time, depending on the size of the account.

### Requirements

- Claude 3.7 enabled on your AWS account

### Local

To perform a local analysis, you don't need to provide any custom roles or policies.
<br>A default role will be created for you and automatically used if no explicit role is provided.

### Remote

To perform a remote analysis, you must provide a custom role with these managed policies:

- SecurityAudit
- job-function/ViewOnlyAccess

And the following inline policy: [Inline Policy](../webui/public/inline-policy.json)

Additionally, add the following trust policy to your role:

```json
{
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
}
```
