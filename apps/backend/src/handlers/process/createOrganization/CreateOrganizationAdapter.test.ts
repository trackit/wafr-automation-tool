import { registerTestInfrastructure } from '@backend/infrastructure';
import { Organization, OrganizationMother } from '@backend/models';
import { tokenCreateOrganizationUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { CreateOrganizationAdapter } from './CreateOrganizationAdapter';

describe('CreateOrganizationAdapter', () => {
  it('should throw if domain is not provided', async () => {
    const { adapter } = setup();
    await expect(
      adapter.handle({} as unknown as Organization)
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

  it('should call createOrganization use case', async () => {
    const { useCase, adapter } = setup();
    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAccountId('account-id')
      .withAssessmentExportRoleArn('arn:role')
      .withUnitBasedAgreementId('unit-agreement-id')
      .withFreeAssessmentsLeft(5)
      .build();
    await adapter.handle(organization);
    expect(useCase.createOrganization).toHaveBeenCalledExactlyOnceWith(
      organization
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { createOrganization: vitest.fn() };
  register(tokenCreateOrganizationUseCase, { useValue: useCase });
  const adapter = new CreateOrganizationAdapter();
  return {
    useCase,
    adapter,
  };
};
