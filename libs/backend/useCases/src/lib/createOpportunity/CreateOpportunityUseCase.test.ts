import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakePartnerCentralSellingService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  OrganizationMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  AssessmentOpportunityAlreadyLinkedError,
  OrganizationNotFoundError,
} from '../../errors';
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
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const opportunityId = 'opportunity-123';

    vitest
      .spyOn(fakePartnerCentralSellingService, 'createOpportunity')
      .mockResolvedValueOnce(opportunityId);

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();
    const customerBusinessProblem = `Internal Workload (${assessment.name})`;

    await expect(useCase.createOpportunity(input)).resolves.toBeUndefined();

    expect(
      fakePartnerCentralSellingService.createOpportunity,
    ).toHaveBeenCalledExactlyOnceWith({
      assessment,
      organizationName: organization.name,
      aceIntegration: organization.aceIntegration,
      opportunityDetails: input.opportunityDetails,
      accountId: '123456789012',
      customerBusinessProblem,
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment?.opportunityId).toBe(opportunityId);
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId('missing-assessment')
      .build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw OrganizationNotFoundError if the organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      OrganizationNotFoundError,
    );
  });

  it('should throw AssessmentOpportunityAlreadyLinkedError if the assessment already has an opportunityId', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withOpportunityId('existing-opp')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow(
      AssessmentOpportunityAlreadyLinkedError,
    );
  });

  it('should throw when organization is missing ACE integration', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAceIntegration(undefined)
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateOpportunityUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createOpportunity(input)).rejects.toThrow();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  vitest.useFakeTimers();

  return {
    useCase: new CreateOpportunityUseCaseImpl(),
    fakePartnerCentralSellingService: inject(
      tokenFakePartnerCentralSellingService,
    ),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
