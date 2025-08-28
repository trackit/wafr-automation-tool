import {
  AttributeType,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { User } from '@backend/models';
import { CognitoPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { InfrastructureError, UserNotFoundError } from '../../Errors';
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

    try {
      const res = await this.client.send(cmd);

      if (res.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `Cognito ListUsers failed: ${res.$metadata.httpStatusCode}`,
        });
      }

      const user = res.Users?.[0];
      if (!user) {
        this.logger.info(`Cognito user not found for sub=${userId}`);
        throw new UserNotFoundError({ userId });
      }

      this.logger.info(`Fetched Cognito user sub=${userId}`);
      const attrs = this.toAttrMap(user.Attributes ?? []);
      return {
        id: userId,
        email: attrs.email,
        organizationDomain: attrs.email.split('@')[1],
      };
    } catch (err) {
      this.logger.error(`Error fetching Cognito user sub=${userId}: ${err}`);
      throw err;
    }
  }
}

export const tokenCognitoService = createInjectionToken<CognitoPort>(
  'CognitoService',
  {
    useClass: CognitoService,
  }
);

export const tokenCognitoClient =
  createInjectionToken<CognitoIdentityProviderClient>(
    'CognitoIdentityProviderClient',
    {
      useFactory: () =>
        new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION,
        }),
    }
  );

export const tokenCognitoUserPoolId = createInjectionToken<string>(
  'CognitoUserPoolId',
  {
    useFactory: () => {
      const tableName = process.env.COGNITO_USER_POOL_ID;
      assertIsDefined(tableName, 'COGNITO_USER_POOL_ID is not defined');
      return tableName;
    },
  }
);
