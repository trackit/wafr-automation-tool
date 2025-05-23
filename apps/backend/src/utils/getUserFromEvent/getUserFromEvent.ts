import type { APIGatewayProxyEvent } from 'aws-lambda';

import { BadRequestError } from '@backend/errors';
import type { User } from '@backend/models';

export const getUserFromEvent = (event: APIGatewayProxyEvent): User => {
  const userClaims = event.requestContext.authorizer?.claims;

  if (!userClaims) {
    throw new BadRequestError('Missing claims');
  }

  return {
    id: userClaims.sub,
    organizationDomain: userClaims.email.split('@')[1],
    email: userClaims.email,
  };
};
