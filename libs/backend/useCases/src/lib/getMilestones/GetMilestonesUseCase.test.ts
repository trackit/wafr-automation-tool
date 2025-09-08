import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import { AssessmentMother, OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFoundError,
  OrganizationExportRoleNotSetError,
  OrganizationNotFoundError,
} from '../../errors';
import { GetMilestonesUseCaseImpl } from './GetMilestonesUseCase';

describe('GetMilestonesUseCase', () => {
  it('should return milestones for a valid assessment', async () => {
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

    const expectedMilestones = [
      { id: 1, name: 'Milestone 1', createdAt: new Date() },
      { id: 2, name: 'Milestone 2', createdAt: new Date() },
    ];

    vi.spyOn(fakeWellArchitectedToolService, 'getMilestones').mockResolvedValue(
      {
        milestones: expectedMilestones,
      }
    );

    const result = await useCase.getMilestones({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      region: 'us-east-1',
    });

    expect(result.milestones).toEqual(expectedMilestones);
    expect(fakeWellArchitectedToolService.getMilestones).toHaveBeenCalledWith({
      roleArn: 'arn:aws:iam::123456789012:role/export-role',
      assessment,
      region: 'us-east-1',
    });
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeOrganizationRepository.organizations['test.io'] = organization;

    await expect(
      useCase.getMilestones({
        assessmentId: 'non-existent-assessment',
        organizationDomain: 'test.io',
        region: 'us-east-1',
      })
    ).rejects.toThrow(AssessmentNotFoundError);
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
      useCase.getMilestones({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
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
      useCase.getMilestones({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        region: 'us-east-1',
      })
    ).rejects.toThrow(OrganizationNotFoundError);
  });

  it('should throw AssessmentExportRegionNotSetError if assessment export region is not set', async () => {
    const { useCase, fakeAssessmentsRepository, fakeOrganizationRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExportRegion(undefined)
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = assessment;

    fakeOrganizationRepository.organizations['test.io'] =
      OrganizationMother.basic()
        .withDomain('test.io')
        .withAssessmentExportRoleArn('export-role-arn')
        .build();

    await expect(
      useCase.getMilestones({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
      })
    ).rejects.toThrow(AssessmentExportRegionNotSetError);
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
