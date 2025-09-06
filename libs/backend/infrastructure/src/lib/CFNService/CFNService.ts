import {
  CloudFormationClient,
  CreateStackInstancesCommand,
  type Parameter,
} from '@aws-sdk/client-cloudformation';
import { CFNPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { tokenLogger } from '../Logger';

export class CFNServce implements CFNPort {
  private readonly cfn = inject(tokenCloudFormationClient);
  private readonly logger = inject(tokenLogger);
  private readonly stackSetName = inject(tokenStackSetName);

  public async addStackSetAccount(args: {
    accountId: string;
    regions: string[];
    parameterOverrides?: Parameter[];
  }) {
    const { accountId, regions, parameterOverrides } = args;

    try {
      const res = await this.cfn.send(
        new CreateStackInstancesCommand({
          StackSetName: this.stackSetName,
          Accounts: [accountId],
          Regions: regions,
          ParameterOverrides: parameterOverrides,
          OperationPreferences: {
            FailureToleranceCount: 0,
            MaxConcurrentCount: 1,
            RegionConcurrencyType: 'SEQUENTIAL',
          },
        })
      );

      const opId = res.OperationId;
      if (!opId) {
        throw new Error('CreateStackInstances returned no OperationId');
      }
      this.logger.info(
        `StackSet addAccount started: ${
          this.stackSetName
        } -> ${accountId} in [${regions.join(', ')}], op=${opId}`
      );
    } catch (err) {
      this.logger.error(
        `CreateStackInstances failed: ${
          this.stackSetName
        } -> ${accountId} in [${regions.join(', ')}]`,
        err
      );
      throw err;
    }
  }
}

export const tokenCFNService = createInjectionToken<CFNServce>('CFNServce', {
  useClass: CFNServce,
});

export const tokenCloudFormationClient =
  createInjectionToken<CloudFormationClient>('CloudFormationClient', {
    useClass: CloudFormationClient,
  });

export const tokenStackSetName = createInjectionToken<string>('StackSetName', {
  useFactory: () => {
    const name = process.env.STACKSET_NAME;
    assertIsDefined(name, 'STACKSET_NAME is not defined');
    return name;
  },
});
