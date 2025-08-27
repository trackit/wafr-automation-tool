import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentMother,
  AssessmentStep,
  OrganizationMother,
  PillarMother,
  UserMother,
} from '@backend/models';
import { ConflictError, NoContentError, NotFoundError } from '../Errors';
import { CreateMilestoneUseCaseImpl } from './CreateMilestoneUseCase';
import { CreateMilestoneUseCaseArgsMother } from './CreateMilestoneUseCaseArgsMother';

describe('CreateMilestone UseCase', () => {
  it('should call the WellArchitectedToolService infrastructure', async () => {
    const {
      useCase,
      fakeWellArchitectedToolService,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('export-role-arn')
      .build();

    fakeOrganizationRepository.organizations['test.io'] = organization;

    const input = CreateMilestoneUseCaseArgsMother.basic().build();
    await expect(useCase.createMilestone(input)).resolves.toBeUndefined();

    expect(
      fakeWellArchitectedToolService.createMilestone
    ).toHaveBeenCalledExactlyOnceWith({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      user: input.user,
      region: assessment.exportRegion,
      name: input.name,
    });
  });

  it('should throw a NoContentError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([])
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic().build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      NoContentError
    );
  });

  it('should throw a NotFoundError if the assessment doesn’t exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic().build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars(undefined)
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a ConflictError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.PREPARING_ASSOCIATIONS)
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a NotFoundError if the organization doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([PillarMother.basic().build()])
        .withExportRegion('us-west-2')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the organization does not have an export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([PillarMother.basic().build()])
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn(undefined)
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a ConflictError if the assessment export region is not set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([PillarMother.basic().build()])
        .withExportRegion(undefined)
        .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic().build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(ConflictError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeWellArchitectedToolService = inject(
    tokenFakeWellArchitectedToolService
  );
  vitest.spyOn(fakeWellArchitectedToolService, 'createMilestone');
  const useCase = new CreateMilestoneUseCaseImpl();
  return {
    useCase,
    fakeWellArchitectedToolService,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
