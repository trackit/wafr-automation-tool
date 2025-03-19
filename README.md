# Well-Architected Framework Review Automation Tool

- [Overview](#overview)
  - [Architecture](#architecture)
- [Getting started](#getting-started)
  - [Requirements](#requirements)
  - [Backend](#backend)
    - [Installing dependencies](#installing-dependencies)
    - [Tests](#tests)
- [Deployment](#deployment)
  - [Build](#build)
  - [Deploy](#deploy)

## Overview

The Well-Architected Framework Review Automation Tool is a serverless application that automates the process of assessing the architecture of a given AWS account against the Well-Architected Framework.

This tool is designed to be used by AWS Well-Architected Reviewer to assess the architecture of an AWS account against the Well-Architected Framework.

### Architecture

![WAFR Automation Tool Architecture](./resources/WAFR%20Automation%20Architecture.png)

The WAFR Automation Tool uses a serverless architecture built on AWS services:

- Built using AWS Serverless Application Model (SAM)
- Runs as a collection of serverless functions that automatically assess AWS accounts
- Performs automated checks against Well-Architected Framework principles
- Scales automatically based on demand
- Operates with a pay-per-use cost model

## Getting started

The tool leverages Python 3.12 runtime and can be deployed to different environments (dev/prod) using SAM templates.

- [uv](https://docs.astral.sh/uv/#installation)
- [Docker >= 19.03](https://docs.docker.com/get-docker/)
  - the Docker daemon must also be running
- [AWS SAM CLI >= 1.116.0](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions)

### Backend

#### Installing dependencies

Change directory to `backend/` using:

```bash
cd backend/
```

With [uv](https://docs.astral.sh/uv/#installation) installed, run:

```bash
uv sync
```

#### Tests

To run tests locally, run:

```shell
uv run pytest
```

## Deployment

### Build

To build the serverless application, using [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build.html) run:

```bash
sam build --use-container
```

### Deploy

With [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html#serverless-sam-cli-using-package-and-deploy), run:

```bash
sam deploy --config-env <dev|prod>
```
