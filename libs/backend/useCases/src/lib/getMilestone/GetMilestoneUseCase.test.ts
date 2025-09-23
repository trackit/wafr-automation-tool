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
  PillarMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFoundError,
  MilestoneNotFoundError,
  OrganizationExportRoleNotSetError,
  OrganizationNotFoundError,
} from '../../errors';
import { GetMilestoneUseCaseImpl } from './GetMilestoneUseCase';
import { GetMilestoneUseCaseArgsMother } from './GetMilestoneUseCaseArgsMother';

describe('GetMilestoneUseCase', () => {
  it('should return milestone for a valid milestone', async () => {
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

    const expectedPillars = [
      PillarMother.basic().withId('pillar-1').withLabel('Pillar 1').build(),
      PillarMother.basic().withId('pillar-2').withLabel('Pillar 2').build(),
    ];
    const milestone = MilestoneMother.basic()
      .withId(1)
      .withName('Milestone 1')
      .withCreatedAt(new Date('2023-01-01T00:00:00Z'))
      .withPillars(expectedPillars)
      .build();
    vitest.spyOn(fakeWellArchitectedToolService, 'getMilestone').mockResolvedValue(
      milestone
    );

    const result = await useCase.getMilestone({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      milestoneId: milestone.id,
      region: 'us-east-1',
    });

    expect(result).toEqual(milestone);
    expect(fakeWellArchitectedToolService.getMilestone).toHaveBeenCalledWith({
      roleArn: 'arn:aws:iam::123456789012:role/export-role',
      assessment,
      region: 'us-east-1',
      milestoneId: milestone.id,
    });
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn(undefined)
      .build();
    await fakeOrganizationRepository.save(organization);

    const input = GetMilestoneUseCaseArgsMother.basic()
      .withOrganizationDomain(organization.domain)
      .build();

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      AssessmentNotFoundError
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

    const input = GetMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(organization.domain)
      .withMilestoneId(1)
      .withRegion('us-east-1')
      .build();

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      OrganizationExportRoleNotSetError
    );
  });

  it('should throw OrganizationNotFoundError if organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withMilestoneId(1)
      .withRegion('us-east-1')
      .build();

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      OrganizationNotFoundError
    );
  });

  it('should throw MilestoneNotFoundError if milestone does not exist', async () => {
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
      .withExportRegion('us-east-1')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    vitest.spyOn(fakeWellArchitectedToolService, 'getMilestone').mockReturnValue(
      Promise.resolve(undefined)
    );

    const input = GetMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withMilestoneId(999)
      .withRegion('us-east-1')
      .build();

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      MilestoneNotFoundError
    );
  });

  it('should throw AssessmentExportRegionNotSetError if assessment has no export region set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withExportRegion(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetMilestoneUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withMilestoneId(1)
      .build();

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      AssessmentExportRegionNotSetError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetMilestoneUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeWellArchitectedToolService: inject(tokenFakeWellArchitectedToolService),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
