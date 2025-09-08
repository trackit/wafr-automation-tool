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

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;
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
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
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

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn(undefined)
      .build();
    fakeOrganizationRepository.organizations['test.io'] = organization;

    const input = GetMilestoneUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.getMilestone(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should throw OrganizationExportRoleNotSetError if organization does not have export role ARN', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn(undefined)
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestone({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        milestoneId: 1,
        region: 'us-east-1',
      })
    ).rejects.toThrow(OrganizationExportRoleNotSetError);
  });

  it('should throw OrganizationNotFoundError if organization does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;

    await expect(
      useCase.getMilestone({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        milestoneId: 1,
        region: 'us-east-1',
      })
    ).rejects.toThrow(OrganizationNotFoundError);
  });

  it('should throw MilestoneNotFoundError if milestone does not exist', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeOrganizationRepository,
      fakeWellArchitectedToolService,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExportRegion('us-east-1')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    vi.spyOn(fakeWellArchitectedToolService, 'getMilestone').mockReturnValue(
      Promise.resolve(undefined)
    );

    await expect(
      useCase.getMilestone({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        milestoneId: 999,
        region: 'us-east-1',
      })
    ).rejects.toThrow(MilestoneNotFoundError);
  });

  it('should throw AssessmentExportRegionNotSetError if assessment has no export region set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExportRegion(undefined)
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestone({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        milestoneId: 1,
      })
    ).rejects.toThrow(AssessmentExportRegionNotSetError);
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
