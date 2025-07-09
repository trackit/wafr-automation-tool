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
      unitBasedAgreementId: 'unitBasedAgreementId',
    });
  }

  public withDomain(domain: string): OrganizationMother {
    this.data.domain = domain;
    return this;
  }

  public withAccountId(accountId: string): OrganizationMother {
    this.data.accountId = accountId;
    return this;
  }

  public withUnitBasedAgreementId(
    unitBasedAgreementId: string
  ): OrganizationMother {
    this.data.unitBasedAgreementId = unitBasedAgreementId;
    return this;
  }

  public build(): Organization {
    return this.data;
  }
}
