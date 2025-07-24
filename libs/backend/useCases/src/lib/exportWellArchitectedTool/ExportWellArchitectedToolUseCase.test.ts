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
      region: input.region,
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

  it('should throw a NotFoundError if the organization doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([PillarMother.basic().build()])
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
