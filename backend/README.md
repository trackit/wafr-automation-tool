# Backend

## Table of contents

- [Overview](#overview)
- [Getting started](#getting-started)
  - [Requirements](#requirements)
  - [Installing dependencies](#installing-dependencies)
  - [Tests](#tests)
- [Usage](#usage)
  - [Local](#local)
  - [Remote](#remote)

## Overview

This AWS serverless backend provides a scalable and maintainable solution, integrating API Gateway and Lambda functions to handle user requests. AWS Step Functions orchestrate the execution of ECS tools (Cloud Custodian, Prowler, CloudSploit). Results from these tools are stored in S3 and DynamoDB, then analyzed by Amazon Bedrock (LLM) to automatically compare findings with AWS WAFR best practices. This allows precise mapping of findings to best practices, making it possible to display them on the frontend.

## Getting started

### Requirements

The tool leverages Python 3.12 runtime and can be deployed to different environments (dev/prod) using SAM templates.

- [uv](https://docs.astral.sh/uv/#installation)
- [Docker >= 19.03](https://docs.docker.com/get-docker/)
  - the Docker daemon must also be running
- [AWS SAM CLI >= 1.116.0](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions)

### Installing dependencies

Change directory to `backend/` using:

```bash
cd backend/
```

With [uv](https://docs.astral.sh/uv/#installation) installed, run:

```bash
uv sync
```

### Tests

To run tests locally, run:

```shell
uv run pytest
```

## Usage

In both cases, a complete analysis takes a long time, depending on the size of the account.

### Local

To perform a local analysis, you don't need to provide any custom roles or policies.
<br>A default role will be created for you and automatically used if no explicit role is provided.

### Remote

To perform a remote analysis, you must provide a custom role with these managed policies:

- SecurityAudit
- job-function/ViewOnlyAccess

And the following inline policy: [Inline Policy](../resources/inline-policy.json)