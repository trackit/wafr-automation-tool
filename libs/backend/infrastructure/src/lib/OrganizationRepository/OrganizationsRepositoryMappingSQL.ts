import { Organization } from '@backend/models';

import { OrganizationEntity } from '../infrastructure';

export function toDomainOrganization(e: OrganizationEntity): Organization {
  return {
    domain: e.domain,
    name: e.name,
    accountId: e.accountId,
    assessmentExportRoleArn: e.assessmentExportRoleArn,
    unitBasedAgreementId: e.unitBasedAgreementId,
    freeAssessmentsLeft: e.freeAssessmentsLeft,
    aceIntegration: e.aceIntegration
      ? {
          roleArn: e.aceIntegration.roleArn,
          solutions: e.aceIntegration.solutions,
          opportunityTeamMembers: e.aceIntegration.opportunityTeamMembers.map(
            (member) => ({
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
            }),
          ),
        }
      : undefined,
  };
}
