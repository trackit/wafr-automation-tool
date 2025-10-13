import {
  registerTestInfrastructure,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { Organization, OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { CreateOrganizationAdapter } from './CreateOrganizationAdapter';

describe('CreateOrganizationAdapter', () => {
  it('should throw if domain is not provided', async () => {
    const { adapter } = setup();
    await expect(
      adapter.handle({} as unknown as Organization),
    ).rejects.toThrow();
  });

  it('should not throw if optional fields are not provided', async () => {
    const { adapter } = setup();
    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAccountId(undefined)
      .withAssessmentExportRoleArn(undefined)
      .withUnitBasedAgreementId(undefined)
      .withFreeAssessmentsLeft(undefined)
      .build();
    await expect(adapter.handle(organization)).resolves.not.toThrow();
  });

  it('should validate organization', async () => {
    const { adapter } = setup();
    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAccountId('account-id')
      .withAssessmentExportRoleArn('arn:role')
      .withUnitBasedAgreementId('unit-agreement-id')
      .withFreeAssessmentsLeft(5)
      .build();
    await expect(adapter.handle(organization)).resolves.not.toThrow();
  });

  it('should save organization', async () => {
    const { fakeOrganizationRepository, adapter } = setup();
    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAccountId('account-id')
      .withAssessmentExportRoleArn('arn:role')
      .withUnitBasedAgreementId('unit-agreement-id')
      .withFreeAssessmentsLeft(5)
      .build();
    await adapter.handle(organization);
    expect(
      fakeOrganizationRepository.organizations[organization.domain],
    ).toEqual(organization);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const adapter = new CreateOrganizationAdapter();
  return {
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    adapter,
  };
};
