import {
  AssociateOpportunityCommand,
  Contact,
  CountryCode,
  CreateOpportunityCommand,
  Industry,
  PartnerCentralSellingClient,
  PartnerCentralSellingClientConfig,
  RelatedEntityType,
} from '@aws-sdk/client-partnercentral-selling';
import { AssumeRoleCommand } from '@aws-sdk/client-sts';

import {
  AceIntegration,
  Assessment,
  OpportunityDetails,
} from '@backend/models';
import { PartnerCentralSellingPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenDebug } from '../config/debug/config';
import { tokenIdGenerator } from '../IdGenerator';
import { tokenSTSClient } from '../STSClientService';

export class PartnerCentralSellingService implements PartnerCentralSellingPort {
  private readonly stsClient = inject(tokenSTSClient);
  private readonly idgenerator = inject(tokenIdGenerator);
  private readonly debug = inject(tokenDebug);
  private readonly partnerCentralSellingClientConstructor = inject(
    tokenPartnerCentralSellingClientConstructor
  );
  public async createPartnerCentralSellingClient(
    roleArn: string
  ): Promise<PartnerCentralSellingClient> {
    const credentials = await this.stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: 'WAFR-Automation-Tool',
      })
    );
    if (!credentials.Credentials) {
      throw new Error('Failed to assume role');
    }
    return this.partnerCentralSellingClientConstructor({
      credentials: {
        accessKeyId: credentials.Credentials.AccessKeyId!,
        secretAccessKey: credentials.Credentials.SecretAccessKey!,
        sessionToken: credentials.Credentials.SessionToken!,
      },
      region: 'us-east-1',
    });
  }
  public async associateOpportunity(
    client: PartnerCentralSellingClient,
    catalog: string,
    opportunityId: string,
    relatedEntityType: RelatedEntityType,
    relatedEntityIdentifier: string
  ): Promise<void> {
    const command = new AssociateOpportunityCommand({
      Catalog: catalog,
      OpportunityIdentifier: opportunityId,
      RelatedEntityType: relatedEntityType,
      RelatedEntityIdentifier: relatedEntityIdentifier,
    });

    await client.send(command);
  }

  async createOpportunity({
    assessment,
    organizationName,
    aceIntegration,
    opportunityDetails,
    accountId,
    customerBusinessProblem,
  }: {
    assessment: Assessment;
    organizationName: string;
    aceIntegration: AceIntegration;
    opportunityDetails: OpportunityDetails;
    accountId: string;
    customerBusinessProblem: string;
  }): Promise<string> {
    const client = await this.createPartnerCentralSellingClient(
      aceIntegration.roleArn
    );
    const catalog: string = !this.debug ? 'AWS' : 'Sandbox';
    const opportunityTeamMembers: Contact[] =
      aceIntegration.opportunityTeamMembers.map(
        (member): Contact => ({
          Email: member.email,
          FirstName: member.firstName,
          LastName: member.lastName,
        })
      );

    const command = new CreateOpportunityCommand({
      Catalog: catalog,
      ClientToken: `WAFR-${assessment.id}-${this.idgenerator.generate()}`,
      Customer: {
        Account: {
          CompanyName: opportunityDetails.companyName,
          WebsiteUrl: opportunityDetails.companyWebsiteUrl,
          Industry: opportunityDetails.industry as Industry,
          Address: {
            CountryCode: opportunityDetails.customerCountry as CountryCode,
            City: opportunityDetails.customerCity ?? '',
            PostalCode: opportunityDetails.customerPostalCode,
            StreetAddress: opportunityDetails.customerAddress ?? '',
          },
          Duns: opportunityDetails.duns,
          AwsAccountId: accountId,
        },
        Contacts: [],
      },
      Project: {
        ApnPrograms: ['Well-Architected'],
        DeliveryModels: ['Professional Services'],
        CustomerUseCase: 'AI Machine Learning and Analytics',
        Title: `WAFR - ${opportunityDetails.companyName}`,
        CustomerBusinessProblem: `${organizationName} performed a well-architected framework on ${customerBusinessProblem} to ensure the environment was following AWS best practices with a focus on security and cost`,
        ExpectedCustomerSpend: [
          {
            Amount: opportunityDetails.monthlyRecurringRevenue,
            CurrencyCode: 'USD',
            Frequency: 'Monthly',
            TargetCompany: 'AWS',
          },
        ],
        AdditionalComments: `ARN: ${assessment.wafrWorkloadArn}`,
      },
      OpportunityType: 'Net New Business',
      OpportunityTeam: opportunityTeamMembers ?? [],
      LifeCycle: {
        TargetCloseDate: opportunityDetails.targetCloseDate,
      },
    });
    const createResult = await client.send(command);
    const returnedOpportunityId = createResult.Id!;
    for (const solution of aceIntegration.solutions) {
      await this.associateOpportunity(
        client,
        catalog,
        returnedOpportunityId,
        'Solutions',
        solution
      );
    }
    return returnedOpportunityId;
  }
}
export const tokenPartnerCentralSellingService =
  createInjectionToken<PartnerCentralSellingPort>(
    'PartnerCentralSellingService',
    {
      useClass: PartnerCentralSellingService,
    }
  );

export const tokenPartnerCentralSellingClientConstructor = createInjectionToken<
  PartnerCentralSellingClient['constructor']
>('PartnerCentralSellingClientConstructor', {
  useFactory: () => {
    return (...args: [] | [PartnerCentralSellingClientConfig]) =>
      new PartnerCentralSellingClient(...args);
  },
});
