import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  OrganizationMother,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';
import { ExportWellArchitectedToolUseCaseImpl } from './ExportWellArchitectedToolUseCase';
import { ExportWellArchitectedToolUseCaseArgsMother } from './ExportWellArchitectedToolUseCaseArgsMother';

vitest.useFakeTimers();

describe('ExportWellArchitectedToolUseCase', () => {
  it('should call the WellArchitectedToolService infrastructure', async () => {
    const {
      useCase,
      fakeWellArchitectedToolService,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
    } = setup();

    const organization = OrganizationMother.basic().build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFinished(true)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.exportAssessment(input);

    expect(
      fakeWellArchitectedToolService.exportAssessment,
    ).toHaveBeenCalledExactlyOnceWith({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      user: input.user,
      region: assessment.exportRegion,
    });
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic().build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFinished(true)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars(undefined)
      .withFinished(true)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinished(false)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentExportRegionNotSetError if the assessment does not have an exportRegion and the region is not provided', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinished(true)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withRegion(undefined)
      .build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      AssessmentExportRegionNotSetError,
    );
  });

  it('should not throw an Error if the assessment does not have an exportRegion and the region is provided', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic().build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFinished(true)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withRegion('us-west-2')
      .build();

    await useCase.exportAssessment(input);
  });

  it('should update the assessment export region if the region is provided and the assessment does not have one', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic().build();
    await fakeOrganizationRepository.save(organization);

    const user = UserMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFinished(true)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withRegion('us-west-2')
      .build();

    await useCase.exportAssessment(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: organization.domain,
    });
    expect(updatedAssessment?.exportRegion).toBe(input.region);
  });

  it('should throw OrganizationNotFoundError if the organization doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinished(true)
      .withPillars([PillarMother.basic().build()])
      .withExportRegion('us-west-2')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      OrganizationNotFoundError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const fakeWellArchitectedToolService = inject(
    tokenFakeWellArchitectedToolService,
  );
  vitest.spyOn(fakeWellArchitectedToolService, 'exportAssessment');

  return {
    useCase: new ExportWellArchitectedToolUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeWellArchitectedToolService,
  };
};
