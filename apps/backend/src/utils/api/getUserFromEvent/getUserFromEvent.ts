import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';

import { UserClaimsMissingError } from '../../../errors/UserErrors';

export const getUserFromEvent = (event: APIGatewayProxyEvent): User => {
  const userClaims = event.requestContext.authorizer?.claims;

  if (!userClaims) {
    throw new UserClaimsMissingError();
  }

  return {
    id: userClaims.sub,
    organizationDomain: userClaims.email.split('@')[1],
    email: userClaims.email,
  };
};
