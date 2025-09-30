import {
  AceIntegration,
  Assessment,
  OpportunityDetails,
} from '@backend/models';
import { PartnerCentralSellingPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakePartnerCentralSellingService
  implements PartnerCentralSellingPort
{
  public async createOpportunity(_args: {
    assessment: Assessment;
    organizationName: string;
    aceIntegration: AceIntegration;
    opportunityDetails: OpportunityDetails;
    accountId: string;
    customerBusinessProblem: string;
  }): Promise<string> {
    return '';
  }
}

export const tokenFakePartnerCentralSellingService =
  createInjectionToken<FakePartnerCentralSellingService>(
    'FakePartnerCentralSellingService',
    { useClass: FakePartnerCentralSellingService }
  );
