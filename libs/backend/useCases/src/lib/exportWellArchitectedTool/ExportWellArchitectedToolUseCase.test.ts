import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  OrganizationMother,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ConflictError, NoContentError, NotFoundError } from '../Errors';
import { ExportWellArchitectedToolUseCaseImpl } from './ExportWellArchitectedToolUseCase';
import { ExportWellArchitectedToolUseCaseArgsMother } from './ExportWellArchitectedToolUseCaseArgsMother';

vitest.useFakeTimers();

describe('exportWellArchitectedTool UseCase', () => {
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
      .build();

    fakeOrganizationRepository.organizations['test.io'] = organization;

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).resolves.toBeUndefined();

    expect(
      fakeWellArchitectedToolService.exportAssessment
    ).toHaveBeenCalledExactlyOnceWith({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      user: input.user,
      region: assessment.exportRegion,
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
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      NoContentError
    );
  });

  it('should throw a NotFoundError if the assessment doesn’t exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      NotFoundError
    );
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
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      ConflictError
    );
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
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      ConflictError
    );
  });

  it('should throw a ConflictError if the assessment does not have an exportRegion and the region is not provided', async () => {
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
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withRegion(undefined)
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      ConflictError
    );
  });

  it('should not throw a ConflictError if the assessment does not have an exportRegion and the region is provided', async () => {
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
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withRegion('us-west-2')
      .build();
    await expect(useCase.exportAssessment(input)).resolves.not.toThrow();
  });

  it('should update the assessment export region if the region is provided and the assessment does not have one', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion(undefined)
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic().withDomain('test.io').build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withRegion('us-west-2')
      .build();
    await useCase.exportAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
        .exportRegion
    ).toBe('us-west-2');
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

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeWellArchitectedToolService = inject(
    tokenFakeWellArchitectedToolService
  );
  vitest.spyOn(fakeWellArchitectedToolService, 'exportAssessment');
  const useCase = new ExportWellArchitectedToolUseCaseImpl();
  return {
    useCase,
    fakeWellArchitectedToolService,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
