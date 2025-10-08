import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeCostExplorerService,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BillingInformationMother,
  OrganizationMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';
import { GetBillingInformationUseCaseImpl } from './GetBillingInformationUseCase';
import { GetBillingInformationUseCaseArgsMother } from './GetBillingInformationUseCaseArgsMother';

describe('GetBillingInformationUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetBillingInformationUseCaseArgsMother.basic()
      .withAssessmentId('missing-assessment')
      .build();

    await expect(useCase.getBillingInformation(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw OrganizationNotFoundError if organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withOrganization('missing-organization')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetBillingInformationUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    await expect(useCase.getBillingInformation(input)).rejects.toThrow(
      OrganizationNotFoundError,
    );
  });

  it('should call CostExplorerService and update assessment', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
      fakeCostExplorerService,
    } = setup();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withName('Test Org')
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withRoleArn('arn:aws:iam::123456789012:role/test-role')
      .withRegions(['us-east-1', 'us-west-2'])
      .withCreatedAt(new Date('2025-08-31T00:00:00Z'))
      .withOrganization(organization.domain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const billingInformation = BillingInformationMother.basic().build();

    vitest
      .spyOn(fakeCostExplorerService, 'getBillingInformation')
      .mockResolvedValueOnce(billingInformation);

    const input = GetBillingInformationUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    await useCase.getBillingInformation(input);

    expect(
      fakeCostExplorerService.getBillingInformation,
    ).toHaveBeenCalledExactlyOnceWith({
      accountId: '123456789012',
      timePeriod: {
        startDate: '2025-08-01',
        endDate: '2025-08-31',
      },
      regions: ['us-east-1', 'us-west-2'],
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment?.billingInformation).toEqual(billingInformation);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const fakeCostExplorerService = inject(tokenFakeCostExplorerService);

  return {
    useCase: new GetBillingInformationUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeCostExplorerService,
  };
};
