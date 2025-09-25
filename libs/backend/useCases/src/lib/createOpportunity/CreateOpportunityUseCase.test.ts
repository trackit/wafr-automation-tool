import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakePartnerCentralSellingService,
} from '@backend/infrastructure';
import { AssessmentMother, OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ConflictError, NotFoundError } from '../Errors';
import { CreateOpportunityUseCaseImpl } from './CreateOpportunityUseCase';
import { CreateOpportunityUseCaseArgsMother } from './CreateOpportunityUseCaseArgsMother';

describe('CreateOpportunity UseCase', () => {
  it('should call PartnerCentralSellingService and update assessment', async () => {
    const {
      useCase,
      fakePartnerCentralSellingService,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withName('Test Org')
      .withAceIntegration({
        opportunityTeamMembers: [
          {
            email: 'email@test.io',
            firstName: 'firstname',
            lastName: 'lastname',
          },
        ],
        roleArn: 'aceIntegrationRoleArn',
        solutions: ['aceIntegrationSolution'],
      })
      .build();

    fakeOrganizationRepository.organizations['test.io'] = organization;
    const accountId = '123456789012';
    vitest
      .spyOn(fakePartnerCentralSellingService, 'createOpportunity')
      .mockResolvedValueOnce('opportunity-123');

    const input = CreateOpportunityUseCaseArgsMother.basic().build();
    const customerBusinessProblem = `Internal Workload (${assessment.name})`;

    await expect(useCase.createOpportunity(input)).resolves.toBeUndefined();

    expect(
      fakePartnerCentralSellingService.createOpportunity
    ).toHaveBeenCalledExactlyOnceWith({
      assessment,
      organizationName: organization.name,
      aceIntegration: organization.aceIntegration,
      opportunityDetails: input.opportunityDetails,
      accountId,
      customerBusinessProblem,
    });

    expect(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
        .opportunityId
    ).toBe('opportunity-123');
  });

  it('should throw NotFoundError if the assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic().withDomain('test.io').build();

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId('missing-assessment')
      .build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw NotFoundError if the organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = CreateOpportunityUseCaseArgsMother.basic().build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw ConflictError if the assessment already has an opportunityId', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withOpportunityId('existing-opp')
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic().withDomain('test.io').build();

    const input = CreateOpportunityUseCaseArgsMother.basic().build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      ConflictError
    );
  });

  it('should throw when organization is missing ACE integration', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic().withDomain('test.io').build();

    const input = CreateOpportunityUseCaseArgsMother.basic().build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  vitest.useFakeTimers();
  const fakePartnerCentralSellingService = inject(
    tokenFakePartnerCentralSellingService
  );
  vitest
    .spyOn(fakePartnerCentralSellingService, 'createOpportunity')
    .mockResolvedValueOnce('opportunity-123');
  const useCase = new CreateOpportunityUseCaseImpl();
  return {
    useCase,
    fakePartnerCentralSellingService,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
