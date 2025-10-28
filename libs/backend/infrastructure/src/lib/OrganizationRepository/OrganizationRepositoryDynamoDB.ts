import z from 'zod';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  tokenDynamoDBDocument,
  tokenDynamoDBOrganizationTableName,
} from '../config/dynamodb/config';
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

export type DynamoDBOrganization = Organization & { PK: string; name?: string };

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
    return OrganizationSchema.parse({
      ...organization,
      name: organization.name ?? organization.domain,
    });
  }

  public async getAll(): Promise<Organization[]> {
    const result = await this.client.scan({
      TableName: this.tableName,
      Limit: 1000,
    });
    const organizations =
      (result.Items as DynamoDBOrganization[] | undefined) ?? [];
    return organizations.map(({ PK: _PK, ...org }) =>
      OrganizationSchema.parse({
        ...org,
        name: org.name ?? org.domain,
      }),
    );
  }
}

export const tokenOrganizationRepositoryDynamoDB =
  createInjectionToken<OrganizationRepositoryDynamoDB>(
    'OrganizationRepositoryDynamoDB',
    {
      useClass: OrganizationRepositoryDynamoDB,
    },
  );
