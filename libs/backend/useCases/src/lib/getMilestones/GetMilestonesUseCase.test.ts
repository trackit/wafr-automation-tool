import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';
import { AssessmentMother, OrganizationMother } from '@backend/models';
import { ConflictError, NotFoundError } from '../Errors';
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
      .withId('assessment-id')
      .withOrganization('test.io')
      .build();

    const organization = OrganizationMother.basic()
      .withDomain('test.io')
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;
    fakeOrganizationRepository.organizations['test.io'] = organization;

    const expectedMilestones = [
      { id: 1, name: 'Milestone 1', createdAt: new Date() },
      { id: 2, name: 'Milestone 2', createdAt: new Date() },
    ];

    vi.spyOn(fakeWellArchitectedToolService, 'getMilestones').mockResolvedValue(
      expectedMilestones
    );

    const result = await useCase.getMilestones({
      assessmentId: 'assessment-id',
      organizationDomain: 'test.io',
      region: 'us-east-1',
    });

    expect(result).toEqual(expectedMilestones);
    expect(fakeWellArchitectedToolService.getMilestones).toHaveBeenCalledWith({
      roleArn: 'arn:aws:iam::123456789012:role/export-role',
      assessment,
      region: 'us-east-1',
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
      useCase.getMilestones({
        assessmentId: 'non-existent-assessment',
        organizationDomain: 'test.io',
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
      useCase.getMilestones({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
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
      useCase.getMilestones({
        assessmentId: 'assessment-id',
        organizationDomain: 'test.io',
        region: 'us-east-1',
      })
    ).rejects.toThrow(NotFoundError);
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
