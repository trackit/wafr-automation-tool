import type {
  AceIntegration,
  Assessment,
  OpportunityDetails,
} from '@backend/models';

export interface PartnerCentralSellingPort {
  createOpportunity(args: {
    assessment: Assessment;
    organizationName: string;
    aceIntegration: AceIntegration;
    opportunityDetails: OpportunityDetails;
    accountId: string;
    customerBusinessProblem: string;
  }): Promise<string>;
}
