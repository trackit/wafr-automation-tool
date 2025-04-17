# Front-end

![WAFR](../resources/frontend.png)

## Quick tour

This project uses:

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Nx](https://nx.dev/)

## Environment Variables

These enviornment variables need to be set for the webui to work properly. If you use the deploy script these will be filled automatically, if you want to run the front end locally you will need to fill those manually.

- `VITE_API_URL`: The base URL for the API endpoint in API Gateway (e.g., `https://your-api-gateway-url.execute-api.region.amazonaws.com/stage`)
- `VITE_AWS_REGION`: The AWS region where your resources are deployed (e.g., `us-west-2`)
- `VITE_USER_POOL_ID`: The ID of your Amazon Cognito User Pool
- `VITE_IDENTITY_POOL_ID`: The ID of your Amazon Cognito Identity Pool
- `VITE_APP_CLIENT_ID`: The client ID of your Amazon Cognito App Client

## Run the development server

With a valid environment run:

```shell
$ npm run start
```

## Manually build the WebUI

To manually build the WebUI without deploying:

```shell
$ npm run build
```

This will generate the static assets in the `dist/webui` folder. You can then serve these files locally or deploy them to your preferred hosting service.
