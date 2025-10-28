import {
  AttributeType,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { User } from '@backend/models';
import { CognitoPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenLogger } from '../Logger';

export class CognitoService implements CognitoPort {
  private readonly client = inject(tokenCognitoClient);
  private readonly userPoolId = inject(tokenCognitoUserPoolId);
  private readonly logger = inject(tokenLogger);

  private toAttrMap(list: AttributeType[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const a of list) {
      if (a.Name && typeof a.Value === 'string') map[a.Name] = a.Value;
    }
    return map;
  }

  public async getUserById(args: { userId: string }): Promise<User> {
    const { userId } = args;
    const cmd = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Filter: `sub = "${userId}"`,
      Limit: 1,
    });

    const response = await this.client.send(cmd);

    const user = response.Users?.[0];
    if (response.$metadata.httpStatusCode !== 200 || !user) {
      throw new Error(JSON.stringify(response));
    }

    this.logger.info(`Fetched Cognito user sub=${userId}`);
    const attrs = this.toAttrMap(user.Attributes ?? []);
    return {
      id: userId,
      email: attrs.email,
      organizationDomain: attrs.email.split('@')[1],
    };
  }
}

export const tokenCognitoService = createInjectionToken<CognitoPort>(
  'CognitoService',
  {
    useClass: CognitoService,
  },
);

export const tokenCognitoClient =
  createInjectionToken<CognitoIdentityProviderClient>(
    'CognitoIdentityProviderClient',
    {
      useFactory: () =>
        new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION,
        }),
    },
  );

export const tokenCognitoUserPoolId = createInjectionToken<string>(
  'CognitoUserPoolId',
  {
    useFactory: () => {
      const tableName = process.env.COGNITO_USER_POOL_ID;
      assertIsDefined(tableName, 'COGNITO_USER_POOL_ID is not defined');
      return tableName;
    },
  },
);
