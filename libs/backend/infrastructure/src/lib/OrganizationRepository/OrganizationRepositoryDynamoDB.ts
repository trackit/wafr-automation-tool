import z from 'zod';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenDynamoDBDocument } from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';

const OrganizationSchema = z.object({
  domain: z.string(),
  accountId: z.string().optional(),
  assessmentExportRoleArn: z.string().optional(),
  unitBasedAgreementId: z.string().optional(),
  freeAssessmentsLeft: z.number().optional(),
}) as z.ZodType<Organization>;

export type DynamoDBOrganization = Organization & { PK: string };

export class OrganizationRepositoryDynamoDB implements OrganizationRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBOrganizationTableName);

  public async save(args: { organization: Organization }): Promise<void> {
    const { organization } = args;
    const params = {
      TableName: this.tableName,
      Item: {
        PK: organization.domain,
        ...organization,
      },
    };

    try {
      await this.client.put(params);
      this.logger.info(`Organization saved: ${organization.domain}`);
    } catch (error) {
      this.logger.error(`Failed to save organization: ${error}`);
      throw error;
    }
  }

  public async get(args: {
    organizationDomain: string;
  }): Promise<Organization | undefined> {
    const { organizationDomain } = args;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, ...organization } = dynamoOrganization;
    return OrganizationSchema.parse(organization);
  }
}

export const tokenDynamoDBOrganizationTableName = createInjectionToken<string>(
  'DynamoDBOrganizationTableName',
  {
    useFactory: () => {
      const tableName = process.env.ORGANIZATION_TABLE;
      assertIsDefined(tableName, 'ORGANIZATION_TABLE is not defined');
      return tableName;
    },
  }
);
