import z from 'zod';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenDynamoDBDocument } from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';

const OrganizationSchema = z.object({
  domain: z.string(),
  name: z.string(),
  accountId: z.string().optional(),
  assessmentExportRoleArn: z.string().optional(),
  unitBasedAgreementId: z.string().optional(),
  freeAssessmentsLeft: z.number().optional(),
  aceIntegration: z
    .object({
      roleArn: z.string().optional(),
      opportunityTeamMembers: z.array(
        z.object({
          email: z.string(),
          firstName: z.string(),
          lastName: z.string(),
        }),
      ),
      solutions: z.array(z.string()),
    })
    .optional(),
}) as z.ZodType<Organization>;

export type DynamoDBOrganization = Organization & { PK: string };

export class OrganizationRepositoryDynamoDB implements OrganizationRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBOrganizationTableName);

  public async save(organization: Organization): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        PK: organization.domain,
        ...organization,
      },
    };

    await this.client.put(params);
    this.logger.info(`Organization saved: ${organization.domain}`);
  }

  public async get(
    organizationDomain: string,
  ): Promise<Organization | undefined> {
    const params = {
      TableName: this.tableName,
      Key: {
        PK: organizationDomain,
      },
    };

    const result = await this.client.get(params);
    const dynamoOrganization = result.Item as DynamoDBOrganization | undefined;
    this.logger.info(`Organization retrieved: ${organizationDomain}`);

    if (!dynamoOrganization) {
      return undefined;
    }
    const { PK: _PK, ...organization } = dynamoOrganization;
    return OrganizationSchema.parse(organization);
  }
}

export const tokenOrganizationRepository =
  createInjectionToken<OrganizationRepository>('OrganizationRepository', {
    useClass: OrganizationRepositoryDynamoDB,
  });

export const tokenDynamoDBOrganizationTableName = createInjectionToken<string>(
  'DynamoDBOrganizationTableName',
  {
    useFactory: () => {
      const tableName = process.env.ORGANIZATION_TABLE;
      assertIsDefined(tableName, 'ORGANIZATION_TABLE is not defined');
      return tableName;
    },
  },
);
