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

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
  OrganizationExportRoleNotSetError,
  OrganizationNotFoundError,
} from '../../errors';
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
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;

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

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = CreateMilestoneUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
      AssessmentNotFinishedError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withPillars(undefined)
      .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFinishedError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withStep(AssessmentStep.PREPARING_ASSOCIATIONS)
      .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFinishedError
    );
  });

  it('should throw OrganizationNotFoundError if the organization doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      OrganizationNotFoundError
    );
  });

  it('should throw OrganizationExportRoleNotSetError if the organization does not have an export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn(undefined)
        .build();

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      OrganizationExportRoleNotSetError
    );
  });

  it('should throw AssessmentExportRegionNotSetError if the assessment export region is not set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentExportRegionNotSetError
    );
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
