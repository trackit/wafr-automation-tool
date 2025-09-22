import {
  AssociateOpportunityCommand,
  CreateOpportunityCommand,
  PartnerCentralSellingClient,
} from '@aws-sdk/client-partnercentral-selling';
import { AssumeRoleCommand } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';

import {
  AceIntegration,
  AssessmentMother,
  CustomerType,
  OpportunityDetails,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { tokenDebug } from '../config/debug/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { tokenSTSClient } from '../STSClientService';
import {
  PartnerCentralSellingService,
  tokenPartnerCentralSellingClientConstructor,
} from './PartnerCentralSellingService';
describe('PartnerCentralSelling Infrastructure', () => {
  describe('createPartnerCentralSellingClient', () => {
    it('should create a new Partner Central Selling client', async () => {
      const { partnerCentralSellingService, stsClientMock } = setup();

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
        await partnerCentralSellingService.createPartnerCentralSellingClient(
          roleArn
        );

      expect(client).instanceOf(PartnerCentralSellingClient);

      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input
      ).toEqual(
        expect.objectContaining({
          RoleArn: roleArn,
          RoleSessionName: 'WAFR-Automation-Tool',
        })
      );
    });

    it('should throw an error if the STS credentials are missing', async () => {
      const { partnerCentralSellingService, stsClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: undefined,
      });

      await expect(
        partnerCentralSellingService.createPartnerCentralSellingClient(roleArn)
      ).rejects.toThrow(Error);
    });
  });
  describe('createOpportunity', () => {
    it('should create an ACE opportunity', async () => {
      const {
        partnerCentralSellingService,
        stsClientMock,
        partnerCentralSellingClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .withWAFRWorkloadArn(
          'arn:aws:wellarchitected:us-west-2:12345678912:workload/abcd123456789'
        )
        .build();

      const organizationName = 'testOrganization';
      const opportunityDetails: OpportunityDetails = {
        companyName: 'testCompany',
        duns: '123456789',
        industry: 'Aerospace',
        customerType: CustomerType.INTERNAL_WORKLOAD,
        companyWebsiteUrl: 'https://test.io',
        customerCountry: 'US',
        customerPostalCode: '1111',
        monthlyRecurringRevenue: '1111',
        targetCloseDate: '2097-01-01',
        customerCity: 'City',
        customerAddress: 'street',
      };
      const aceIntegration: AceIntegration = {
        opportunityTeamMembers: [
          {
            email: 'email@test.io',
            firstName: 'firstname',
            lastName: 'lastname',
          },
        ],
        roleArn: 'aceIntegrationTestRoleArn',
        solutions: ['aceIntegrationTestSolution'],
      };
      const accountId = '123456789012';
      const customerBusinessProblem = `Internal Workload (${assessment.name})`;
      partnerCentralSellingClientMock
        .on(CreateOpportunityCommand)
        .resolvesOnce({
          $metadata: { httpStatusCode: 200 },
          Id: 'opportunity-abc-123',
        });
      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });
      partnerCentralSellingClientMock.on(AssociateOpportunityCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      const returnedOpportunityId =
        await partnerCentralSellingService.createOpportunity({
          assessment,
          organizationName,
          aceIntegration,
          opportunityDetails,
          accountId,
          customerBusinessProblem,
        });
      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input
      ).toEqual(
        expect.objectContaining({
          RoleArn: 'aceIntegrationTestRoleArn',
          RoleSessionName: 'WAFR-Automation-Tool',
        })
      );
      expect(returnedOpportunityId).toBe('opportunity-abc-123');
      const createCalls = partnerCentralSellingClientMock.commandCalls(
        CreateOpportunityCommand
      );
      expect(createCalls).toHaveLength(1);
      const createInput = createCalls[0].args[0].input;
      expect(createInput).toEqual(
        expect.objectContaining({
          Catalog: 'AWS',
          ClientToken: expect.stringMatching(/^WAFR-/),
          Customer: expect.objectContaining({
            Account: expect.objectContaining({
              CompanyName: 'testCompany',
              WebsiteUrl: 'https://test.io',
              Industry: 'Aerospace',
              Address: expect.objectContaining({
                CountryCode: 'US',
                City: 'City',
                PostalCode: '1111',
                StreetAddress: 'street',
              }),
              Duns: '123456789',
              AwsAccountId: '123456789012',
            }),
            Contacts: expect.any(Array),
          }),
          Project: expect.objectContaining({
            ApnPrograms: expect.arrayContaining(['Well-Architected']),
            DeliveryModels: expect.arrayContaining(['Professional Services']),
            CustomerUseCase: expect.any(String),
            Title: `WAFR - testCompany`,
            CustomerBusinessProblem: expect.stringContaining(
              'testOrganization performed a well-architected framework'
            ),
            ExpectedCustomerSpend: expect.arrayContaining([
              expect.objectContaining({
                Amount: '1111',
                CurrencyCode: 'USD',
                Frequency: 'Monthly',
                TargetCompany: 'AWS',
              }),
            ]),
            AdditionalComments: expect.stringContaining(
              'arn:aws:wellarchitected'
            ),
          }),
          OpportunityType: 'Net New Business',
          OpportunityTeam: expect.arrayContaining([
            expect.objectContaining({
              Email: 'email@test.io',
              FirstName: 'firstname',
              LastName: 'lastname',
            }),
          ]),
          LifeCycle: expect.objectContaining({
            TargetCloseDate: '2097-01-01',
          }),
        })
      );
      const assocCalls = partnerCentralSellingClientMock.commandCalls(
        AssociateOpportunityCommand
      );
      expect(assocCalls).toHaveLength(aceIntegration.solutions.length);
      const assocInputs = assocCalls.map((c) => c.args[0].input);
      expect(assocInputs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Catalog: 'AWS',
            OpportunityIdentifier: 'opportunity-abc-123',
            RelatedEntityType: 'Solutions',
            RelatedEntityIdentifier: 'aceIntegrationTestSolution',
          }),
        ])
      );
    });
    it('should rethrow when CreateOpportunityCommand fails', async () => {
      const {
        partnerCentralSellingService,
        stsClientMock,
        partnerCentralSellingClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .withWAFRWorkloadArn(
          'arn:aws:wellarchitected:us-west-2:12345678912:workload/abcd123456789'
        )
        .build();

      const organizationName = 'testOrganization';
      const opportunityDetails: OpportunityDetails = {
        companyName: 'testCompany',
        duns: '123456789',
        industry: 'Aerospace',
        customerType: CustomerType.INTERNAL_WORKLOAD,
        companyWebsiteUrl: 'https://test.io',
        customerCountry: 'US',
        customerPostalCode: '1111',
        monthlyRecurringRevenue: '1111',
        targetCloseDate: '2097-01-01',
        customerCity: 'City',
        customerAddress: 'street',
      };

      const aceIntegration: AceIntegration = {
        opportunityTeamMembers: [
          {
            email: 'email@test.io',
            firstName: 'firstname',
            lastName: 'lastname',
          },
        ],
        roleArn: 'aceIntegrationTestRoleArn',
        solutions: ['aceIntegrationTestSolution'],
      };
      const accountId = '123456789012';
      const customerBusinessProblem = `Internal Workload (${assessment.name})`;
      partnerCentralSellingClientMock
        .on(CreateOpportunityCommand)
        .resolvesOnce({
          $metadata: { httpStatusCode: 200 },
          Id: 'opportunity-abc-123',
        });
      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'a',
          SecretAccessKey: 'b',
          SessionToken: 'c',
          Expiration: new Date(),
        },
      });

      partnerCentralSellingClientMock
        .on(CreateOpportunityCommand)
        .rejects(new Error('CreateOpportunityCommand failed'));

      await expect(
        partnerCentralSellingService.createOpportunity({
          assessment,
          organizationName,
          aceIntegration,
          opportunityDetails,
          accountId,
          customerBusinessProblem,
        })
      ).rejects.toThrow('CreateOpportunityCommand failed');
    });
  });
});

const setup = (debug = false) => {
  reset();
  registerTestInfrastructure();

  register(tokenDebug, { useValue: debug });
  const partnerCentralSellingClient = new PartnerCentralSellingClient();
  register(tokenPartnerCentralSellingClientConstructor, {
    useFactory: () => {
      return () => partnerCentralSellingClient;
    },
  });
  const partnerCentralSellingService = new PartnerCentralSellingService();
  const partnerCentralSellingClientMock = mockClient(
    partnerCentralSellingClient
  );
  const stsClientMock = mockClient(inject(tokenSTSClient));
  return {
    partnerCentralSellingService,
    stsClientMock,
    partnerCentralSellingClient,
    partnerCentralSellingClientMock,
  };
};
