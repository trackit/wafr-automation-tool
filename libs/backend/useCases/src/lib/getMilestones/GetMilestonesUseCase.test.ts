import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  MilestoneMother,
  OrganizationMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFoundError,
  OrganizationExportRoleNotSetError,
  OrganizationNotFoundError,
} from '../../errors';
import { GetMilestonesUseCaseImpl } from './GetMilestonesUseCase';
import { GetMilestonesUseCaseArgsMother } from './GetMilestonesUseCaseArgsMother';

describe('GetMilestonesUseCase', () => {
  it('should return milestones for a valid assessment', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
      fakeWellArchitectedToolService,
    } = setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const expectedMilestones = [
      MilestoneMother.basic().withId(1).withName('Milestone 1').build(),
      MilestoneMother.basic().withId(2).withName('Milestone 2').build(),
    ];

    vitest
      .spyOn(fakeWellArchitectedToolService, 'getMilestones')
      .mockResolvedValue({
        milestones: expectedMilestones,
      });

    const input = GetMilestonesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegion('us-east-1')
      .build();

    const result = await useCase.getMilestones(input);

    expect(result.milestones).toEqual(expectedMilestones);
    expect(fakeWellArchitectedToolService.getMilestones).toHaveBeenCalledWith({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region: input.region,
    });
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();
    await fakeOrganizationRepository.save(organization);

    const input = GetMilestonesUseCaseArgsMother.basic()
      .withAssessmentId('non-existent-assessment')
      .withOrganizationDomain(organization.domain)
      .build();

    await expect(useCase.getMilestones(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw OrganizationExportRoleNotSetError if organization does not have export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn(undefined)
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetMilestonesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    await expect(useCase.getMilestones(input)).rejects.toThrow(
      OrganizationExportRoleNotSetError,
    );
  });

  it('should throw OrganizationNotFoundError if organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetMilestonesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    await expect(useCase.getMilestones(input)).rejects.toThrow(
      OrganizationNotFoundError,
    );
  });

  it('should throw AssessmentExportRegionNotSetError if assessment export region is not set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('export-role-arn')
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetMilestonesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegion(undefined)
      .build();

    await expect(useCase.getMilestones(input)).rejects.toThrow(
      AssessmentExportRegionNotSetError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetMilestonesUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeWellArchitectedToolService: inject(tokenFakeWellArchitectedToolService),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
