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

describe('CreateMilestoneUseCase', () => {
  it('should call the WellArchitectedToolService infrastructure', async () => {
    const {
      useCase,
      fakeWellArchitectedToolService,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
    } = setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.createMilestone(input);

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
    const { useCase } = setup();

    const input = CreateMilestoneUseCaseArgsMother.basic().build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFinishedError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFinishedError
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      AssessmentNotFinishedError
    );
  });

  it('should throw OrganizationNotFoundError if the organization doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().withOrganizationDomain('test.io').build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      OrganizationNotFoundError
    );
  });

  it('should throw OrganizationExportRoleNotSetError if the organization does not have an export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn(undefined)
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.createMilestone(input)).rejects.toThrow(
      OrganizationExportRoleNotSetError
    );
  });

  it('should throw AssessmentExportRegionNotSetError if the assessment export region is not set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = CreateMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

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
