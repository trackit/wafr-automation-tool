export interface Organization {
  domain: string;
  accountId?: string;
  assessmentExportRoleArn: string;
  unitBasedAgreementId?: string;
  freeAssessmentsLeft?: number;
}
