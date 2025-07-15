import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { tokenDynamoDBClient } from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  OrganizationRepositoryDynamoDB,
  tokenDynamoDBOrganizationTableName,
} from './OrganizationRepositoryDynamoDB';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBOrganizationTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({ TableName: tableName })
  );

  await Promise.all(
    (scanResult.Items || []).map(async (item) => {
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
          },
        })
      );
    })
  );
});

describe('OrganizationRepositoryDynamoDB', () => {
  describe('get', () => {
    it('should get an organization by domain', async () => {
      const { repository } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();

      await repository.save(organization);

      const fetchedOrganization = await repository.get({
        organizationDomain: 'test.io',
      });

      expect(fetchedOrganization).toEqual(organization);
    });
    it('should return undefined if organization does not exist', async () => {
      const { repository } = setup();

      const fetchedOrganization = await repository.get({
        organizationDomain: 'test.io',
      });

      expect(fetchedOrganization).toBeUndefined();
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return { repository: new OrganizationRepositoryDynamoDB() };
};
