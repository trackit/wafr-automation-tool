# Well-Architected Framework Review Automation Tool

- [Getting started](#getting-started)
  - [Requirements](#requirements)
  - [Backend](#backend)
    - [Installing dependencies](#installing-dependencies)
    - [Tests](#tests)
- [Deployment](#deployment)
  - [Build](#build)
  - [Deploy](#deploy)

## Getting started

This project is a [Serverless Application Model (SAM)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) application that can be deployed to AWS.

### Requirements

The following tools need to be installed on your system prior to build and deploy the solution:

- Python 3.12
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
