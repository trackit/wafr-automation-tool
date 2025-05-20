# Web UI <a href="../../README.md" style="float: right; font-size: medium; line-height: 1.5;">Home</a>

![WAFR](../../resources/frontend.png)

## Table of contents

- [Overview](#overview)
- [Getting started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
  - [Build](#build)
  - [Tests](#tests)
- [Deployment](#deployment)

## Overview

The frontend is a modern, responsive web application designed to provide a seamless user experience for interacting with the Well-Architected Framework Review Automation Tool.

Built with **[React](https://react.dev/)** and **[TypeScript](https://www.typescriptlang.org/)**, it ensures maintainability and type safety throughout the codebase. Styling is handled via **[Tailwind CSS](https://tailwindcss.com/)** combined with **[DaisyUI](https://daisyui.com/)** components, allowing rapid UI development with a clean and consistent design system.

For efficient data fetching and state management, the app leverages **[TanStack Query](https://tanstack.com/query/latest)**, enabling optimized asynchronous requests, caching, and automatic updates.

Key frontend features include:

- Intuitive dashboard displaying the results of automated AWS architecture assessments
- Real-time status updates on ongoing analyses
- Secure authentication and authorization managed through [AWS Cognito](https://aws.amazon.com/fr/cognito/) integration
- Support for multiple AWS accounts and user roles
- Ability to export assessments directly into the official [AWS Well-Architected Tool](https://aws.amazon.com/fr/well-architected-tool/) for further review and action
- Responsive design compatible with desktop and mobile devices

This frontend connects to the backend API Gateway, consuming REST endpoints that provide access to analysis data and user management functions.

## Getting started

### Environment Variables

The following environment variables must be configured for the frontend to function correctly.
<br/>To run the frontend locally, you need to set them manually.

**Note:** The backend must be deployed first for the frontend to connect properly.

| Variable                | Description                                          | Example                                                               | Where to find it                                                     |
| ----------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `VITE_API_URL`          | Base URL of the API Gateway endpoint                 | `https://your-api-gateway-url.execute-api.region.amazonaws.com/stage` | After deployment, found in the **prod stage URL** of the API Gateway |
| `VITE_AWS_REGION`       | AWS region where your backend resources are deployed | `us-west-2`                                                           | User’s choice based on preferred deployment region                   |
| `VITE_USER_POOL_ID`     | Amazon Cognito User Pool ID                          | `us-west-2_XXXXXXXXX`                                                 | Provided in the CloudFormation stack output of the API stack         |
| `VITE_IDENTITY_POOL_ID` | Amazon Cognito Identity Pool ID                      | `us-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`                      | Provided in the CloudFormation stack output of the API stack         |
| `VITE_APP_CLIENT_ID`    | Amazon Cognito App Client ID                         | `xxxxxxxxxxxxxxxxxxxxxxxxxx`                                          | Provided in the CloudFormation stack output of the API stack         |

### Run Locally

With the environment variables configured, start the development server by running:

```shell
$ npm run start:webui
```

The application will be available locally, typically at http://localhost:4200.

### Build

To build the frontend without deploying, run:

```shell
$ npm run build:webui
```

This command generates static assets in the `dist/webui` folder, which can be served locally or deployed to any static hosting service.

### Tests

Run frontend tests locally with:

```shell
$ npm run test:webui
```

## Deployment

The frontend (WebUI) is deployed automatically alongside the backend via AWS Amplify, ensuring smooth integration and continuous delivery.
