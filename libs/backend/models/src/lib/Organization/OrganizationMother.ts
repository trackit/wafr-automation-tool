import { type AceIntegration, type Organization } from './Organization';

export class OrganizationMother {
  private data: Organization;

  private constructor(data: Organization) {
    this.data = data;
  }

  public static basic(): OrganizationMother {
    return new OrganizationMother({
      domain: 'domain',
      name: 'name',
      accountId: 'accountId',
      assessmentExportRoleArn: 'assessmentExportRoleArn',
      unitBasedAgreementId: 'unitBasedAgreementId',
      freeAssessmentsLeft: 0,
    });
  }

  public withDomain(domain: string): OrganizationMother {
    this.data.domain = domain;
    return this;
  }

  public withName(name: string): OrganizationMother {
    this.data.name = name;
    return this;
  }

  public withAccountId(accountId: string | undefined): OrganizationMother {
    this.data.accountId = accountId;
    return this;
  }

  public withAssessmentExportRoleArn(
    assessmentExportRoleArn: string | undefined,
  ): OrganizationMother {
    this.data.assessmentExportRoleArn = assessmentExportRoleArn;
    return this;
  }

  public withUnitBasedAgreementId(
    unitBasedAgreementId: string | undefined,
  ): OrganizationMother {
    this.data.unitBasedAgreementId = unitBasedAgreementId;
    return this;
  }

  public withFreeAssessmentsLeft(
    freeAssessmentsLeft: number | undefined,
  ): OrganizationMother {
    this.data.freeAssessmentsLeft = freeAssessmentsLeft;
    return this;
  }

  public withAceIntegration(
    aceIntegration: AceIntegration | undefined,
  ): OrganizationMother {
    this.data.aceIntegration = aceIntegration;
    return this;
  }

  public withAceRoleArn(roleArn: string): OrganizationMother {
    this.getAceIntegration().roleArn = roleArn;
    return this;
  }

  public withAceSolutions(solutions: string[]): OrganizationMother {
    this.getAceIntegration().solutions = solutions;
    return this;
  }

  public withOpportunityTeamMembers(
    members: { firstName: string; lastName: string; email: string }[],
  ): OrganizationMother {
    this.getAceIntegration().opportunityTeamMembers = members;
    return this;
  }

  private getAceIntegration(): AceIntegration {
    if (!this.data.aceIntegration) {
      this.data.aceIntegration = {
        roleArn: '',
        opportunityTeamMembers: [],
        solutions: [],
      };
    }
    return this.data.aceIntegration;
  }
  public build(): Organization {
    return this.data;
  }
}
