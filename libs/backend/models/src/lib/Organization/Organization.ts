export interface Organization {
  domain: string;
  name: string;
  accountId?: string;
  assessmentExportRoleArn?: string;
  unitBasedAgreementId?: string;
  freeAssessmentsLeft?: number;
  aceIntegration?: AceIntegration;
  folders?: string[];
}
export interface AceIntegration {
  roleArn: string;
  opportunityTeamMembers: OpportunityTeamMembers[];
  solutions: string[];
}
interface OpportunityTeamMembers {
  firstName: string;
  lastName: string;
  email: string;
}
