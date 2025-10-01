import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ZodError } from 'zod';

import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  tokenDynamoDBClient,
  tokenDynamoDBDocument,
} from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  OrganizationRepositoryDynamoDB,
  tokenDynamoDBOrganizationTableName,
} from './OrganizationRepositoryDynamoDB';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBOrganizationTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({ TableName: tableName }),
  );

  await Promise.all(
    (scanResult.Items || []).map(async (item) => {
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
          },
        }),
      );
    }),
  );
});

describe('OrganizationRepositoryDynamoDB', () => {
  describe('get', () => {
    it('should get an organization by domain', async () => {
      const { repository } = setup();

      const domain = 'test.io';
      const organization = OrganizationMother.basic()
        .withDomain(domain)
        .build();

      await repository.save(organization);

      const fetchedOrganization = await repository.get(domain);

      expect(fetchedOrganization).toEqual(organization);
    });

    it('should return undefined if organization does not exist', async () => {
      const { repository } = setup();

      const fetchedOrganization = await repository.get('test.io');

      expect(fetchedOrganization).toBeUndefined();
    });

    it('should throw a ZodError if organization is invalid', async () => {
      const { repository } = setup();

      const client = inject(tokenDynamoDBDocument);
      const tableName = inject(tokenDynamoDBOrganizationTableName);
      const domain = 'test.io';
      await client.put({
        TableName: tableName,
        Item: {
          PK: domain,
          NOT_A_VALID_FIELD: 'test',
        },
      });

      await expect(repository.get(domain)).rejects.toThrowError(ZodError);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return { repository: new OrganizationRepositoryDynamoDB() };
};
