import { Organization } from './Organization';

export class OrganizationMother {
  private data: Organization;

  private constructor(data: Organization) {
    this.data = data;
  }

  public static basic(): OrganizationMother {
    return new OrganizationMother({
      domain: 'domain',
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

  public withAccountId(accountId: string | undefined): OrganizationMother {
    this.data.accountId = accountId;
    return this;
  }

  public withAssessmentExportRoleArn(
    assessmentExportRoleArn: string
  ): OrganizationMother {
    this.data.assessmentExportRoleArn = assessmentExportRoleArn;
    return this;
  }

  public withUnitBasedAgreementId(
    unitBasedAgreementId: string
  ): OrganizationMother {
    this.data.unitBasedAgreementId = unitBasedAgreementId;
    return this;
  }

  public withFreeAssessmentsLeft(
    freeAssessmentsLeft: number
  ): OrganizationMother {
    this.data.freeAssessmentsLeft = freeAssessmentsLeft;
    return this;
  }

  public build(): Organization {
    return this.data;
  }
}
