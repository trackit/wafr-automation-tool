import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetDimensionValuesCommand,
} from '@aws-sdk/client-cost-explorer';
import { AssumeRoleCommand } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, register, reset } from '@shared/di-container';

import {
  CostExplorerService,
  registerTestInfrastructure,
  tokenCostExplorerClientConstructor,
} from '../infrastructure';
import { tokenSTSClient } from '../STSService';

describe('CostExplorerService', () => {
  describe('createCostExplorerClient', () => {
    it('should create a new Cost Explorer client', async () => {
      const { costExplorerService, stsClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      const client =
        await costExplorerService.createCostExplorerClient(roleArn);

      expect(client).instanceOf(CostExplorerClient);

      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input,
      ).toEqual(
        expect.objectContaining({
          RoleArn: roleArn,
          RoleSessionName: 'WAFR-Automation-Tool',
        }),
      );
    });

    it('should throw an error if the STS credentials are missing', async () => {
      const { costExplorerService, stsClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: undefined,
      });

      await expect(
        costExplorerService.createCostExplorerClient(roleArn),
      ).rejects.toThrow(Error);
    });
  });

  describe('getDimensionValues', () => {
    it('should return a list of dimension values', async () => {
      const {
        costExplorerService,
        costExplorerClientMock,
        costExplorerClient,
      } = setup();

      const timePeriod = { startDate: '2023-01-01', endDate: '2023-01-31' };

      costExplorerClientMock
        .on(GetDimensionValuesCommand)
        .resolves({ DimensionValues: [{ Value: 'AmazonEC2' }] });

      const dimensionValues = await costExplorerService.getDimensionValues({
        client: costExplorerClient,
        timePeriod,
      });

      expect(dimensionValues).toEqual(['AmazonEC2']);

      expect(
        costExplorerClientMock.commandCalls(GetDimensionValuesCommand),
      ).toHaveLength(1);
      expect(
        costExplorerClientMock.commandCalls(GetDimensionValuesCommand)[0]
          .args[0].input,
      ).toEqual(
        expect.objectContaining({
          Dimension: 'SERVICE',
          TimePeriod: {
            Start: timePeriod.startDate,
            End: timePeriod.endDate,
          },
        }),
      );
    });
  });

  describe('getBillingInformation', () => {
    it('should return billing information', async () => {
      const { costExplorerService, costExplorerClientMock, stsClientMock } =
        setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const accountId = '123456789012';
      const timePeriod = { startDate: '2023-01-01', endDate: '2023-01-31' };
      const regions = ['us-east-1'];

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      costExplorerClientMock.on(GetDimensionValuesCommand).resolves({
        DimensionValues: [{ Value: 'AmazonEC2' }, { Value: 'AmazonS3' }],
      });

      costExplorerClientMock.on(GetCostAndUsageCommand).resolves({
        ResultsByTime: [
          {
            Groups: [
              {
                Keys: ['AmazonEC2'],
                Metrics: { BlendedCost: { Amount: '10.50', Unit: 'USD' } },
              },
              {
                Keys: ['AmazonS3'],
                Metrics: { BlendedCost: { Amount: '5.25', Unit: 'USD' } },
              },
            ],
          },
          {
            Groups: [
              {
                Keys: ['AmazonEC2'],
                Metrics: { BlendedCost: { Amount: '3.75', Unit: 'USD' } },
              },
              {
                Keys: ['AmazonS3'],
                Metrics: { BlendedCost: { Amount: '-2.00', Unit: 'USD' } },
              },
            ],
          },
        ],
      });

      const billingInfo = await costExplorerService.getBillingInformation({
        accountId,
        timePeriod,
        regions,
        roleArn,
      });

      expect(billingInfo).not.toBeNull();
      expect(billingInfo).toHaveProperty(
        'billingPeriodStartDate',
        new Date(timePeriod.startDate),
      );
      expect(billingInfo).toHaveProperty(
        'billingPeriodEndDate',
        new Date(timePeriod.endDate),
      );
      expect(billingInfo).toHaveProperty('totalCost');
      expect(billingInfo!.servicesCost).toBeInstanceOf(Array);

      // AmazonEC2 = 10.50 + 3.75 = 14.25
      // AmazonS3 = 5.25 + (-2.00) -> negative ignored => 5.25
      // total = 14.25 + 5.25 = 19.50
      const ec2 = billingInfo!.servicesCost.find(
        (s) => s.serviceName === 'AmazonEC2',
      );
      const s3 = billingInfo!.servicesCost.find(
        (s) => s.serviceName === 'AmazonS3',
      );

      expect(ec2).toBeDefined();
      expect(ec2!.cost).toBe('14.25');

      expect(s3).toBeDefined();
      expect(s3!.cost).toBe('5.25');

      expect(billingInfo!.totalCost).toBe('19.50');

      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input,
      ).toEqual(
        expect.objectContaining({
          RoleArn: roleArn,
          RoleSessionName: 'WAFR-Automation-Tool',
        }),
      );

      expect(
        costExplorerClientMock.commandCalls(GetDimensionValuesCommand),
      ).toHaveLength(1);
      expect(
        costExplorerClientMock.commandCalls(GetDimensionValuesCommand)[0]
          .args[0].input,
      ).toEqual(
        expect.objectContaining({
          Dimension: 'SERVICE',
          TimePeriod: {
            Start: timePeriod.startDate,
            End: timePeriod.endDate,
          },
        }),
      );

      expect(
        costExplorerClientMock.commandCalls(GetCostAndUsageCommand),
      ).toHaveLength(1);
      const costCall = costExplorerClientMock
        .commandCalls(GetCostAndUsageCommand)
        .find((c) => c.args[0].constructor.name === 'GetCostAndUsageCommand');
      expect(costCall).toBeDefined();
      expect(costCall!.args[0].input).toMatchObject({
        TimePeriod: {
          Start: timePeriod.startDate,
          End: timePeriod.endDate,
        },
        Filter: {
          And: [
            {
              Dimensions: { Key: 'LINKED_ACCOUNT', Values: [accountId] },
            },
            {
              Dimensions: { Key: 'SERVICE', Values: ['AmazonEC2', 'AmazonS3'] },
            },
            {
              Dimensions: { Key: 'REGION', Values: regions },
            },
          ],
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const costExplorerClient = new CostExplorerClient();
  register(tokenCostExplorerClientConstructor, {
    useFactory: () => {
      return () => costExplorerClient;
    },
  });
  const costExplorerService = new CostExplorerService();
  const costExplorerClientMock = mockClient(costExplorerClient);
  const stsClientMock = mockClient(inject(tokenSTSClient));
  return {
    costExplorerService,
    stsClientMock,
    costExplorerClient,
    costExplorerClientMock,
  };
};
