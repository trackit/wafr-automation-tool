import {
  MilestoneNotFoundError,
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  OrganizationMother,
  PillarMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ConflictError, NotFoundError } from '../Errors';
import { GetMilestoneUseCaseImpl } from './GetMilestoneUseCase';

describe('GetMilestoneUseCase', () => {
  it('should return milestone for a valid milestone', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
      fakeWellArchitectedToolService,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    const expectedPillars = [
      PillarMother.basic().withId('pillar-1').withLabel('Pillar 1').build(),
      PillarMother.basic().withId('pillar-2').withLabel('Pillar 2').build(),
    ];

    vi.spyOn(fakeWellArchitectedToolService, 'getMilestone').mockResolvedValue({
      id: 1,
      name: 'Milestone 1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      pillars: expectedPillars,
    });

    const result = await useCase.getMilestone({
      assessmentId: 'assessment-id',
      organizationDomain: 'test.io',
      milestoneId: 1,
      region: 'us-east-1',
    });

    expect(result).toEqual({
      id: 1,
      name: 'Milestone 1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      pillars: expectedPillars,
    });
    expect(fakeWellArchitectedToolService.getMilestone).toHaveBeenCalledWith({
      roleArn: 'arn:aws:iam::123456789012:role/export-role',
      assessment,
      region: 'us-east-1',
      milestoneId: 1,
    });
  });

  it('should throw NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestone({
        assessmentId: 'non-existent-assessment',
        organizationDomain: 'test.io',
        milestoneId: 1,
        region: 'us-east-1',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError if organization does not have export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn(undefined)
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestone({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
        milestoneId: 1,
        region: 'us-east-1',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should throw NotFoundError if organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    await expect(
      useCase.getMilestone({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
        milestoneId: 1,
        region: 'us-east-1',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError if milestone does not exist', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
      fakeWellArchitectedToolService,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    vi.spyOn(fakeWellArchitectedToolService, 'getMilestone').mockRejectedValue(
      new MilestoneNotFoundError({
        assessmentId: 'assessment-id',
        milestoneId: 999,
      })
    );

    await expect(
      useCase.getMilestone({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
        milestoneId: 999,
        region: 'us-east-1',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError if assessment has no export region set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withExportRegion(undefined)
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestone({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
        milestoneId: 1,
      })
    ).rejects.toThrow(ConflictError);
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
