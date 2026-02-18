import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentVersionMother,
  OrganizationMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { GetAssessmentVersionsUseCaseImpl } from './GetAssessmentVersionsUseCase';
import { GetAssessmentVersionsUseCaseArgsMother } from './GetAssessmentVersionsUseCaseArgsMother';

describe('GetAssessmentVersionsUseCase', () => {
  it('should return versions for an assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withOrganization('organization1')
      .withLatestVersionNumber(1)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const version1 = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(assessment.latestVersionNumber)
      .build();

    await fakeAssessmentsRepository.createVersion({
      assessmentVersion: version1,
      organizationDomain: assessment.organization,
    });

    const input = GetAssessmentVersionsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    const result = await useCase.getAssessmentVersions(input);

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].assessmentId).toBe(assessment.id);
    expect(result.versions[0].version).toBe(assessment.latestVersionNumber);
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withAssessmentExportRoleArn('arn:aws:iam::123456789012:role/export-role')
      .build();
    await fakeOrganizationRepository.save(organization);

    const input = GetAssessmentVersionsUseCaseArgsMother.basic()
      .withAssessmentId('non-existent-assessment')
      .withOrganizationDomain(organization.domain)
      .build();

    await expect(useCase.getAssessmentVersions(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should return empty list if no versions exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withOrganization('organization1')
      .withLatestVersionNumber(2)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetAssessmentVersionsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    const result = await useCase.getAssessmentVersions(input);

    expect(result.versions).toEqual([]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetAssessmentVersionsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeWellArchitectedToolService: inject(tokenFakeWellArchitectedToolService),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
