import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, SeverityType } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors/AssessmentErrors';
import { GetAssessmentGraphUseCaseImpl } from './GetAssessmentGraphUseCase';
import { GetAssessmentGraphUseCaseArgsMother } from './GetAssessmentGraphUseCaseArgsMother';

describe('GetAssessmentGraphUseCase', () => {
  it('throws AssessmentNotFoundError when assessment is missing', async () => {
    const { useCase } = setup();

    const input = GetAssessmentGraphUseCaseArgsMother.basic().build();

    await expect(useCase.getAssessmentGraph(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('aggregates severity and resource regions and returns total findings', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const findingHigh = FindingMother.basic()
      .withId('tool#1')
      .withSeverity(SeverityType.High)
      .withResources([
        {
          name: 'resource-high',
          region: 'us-east-1',
          type: 'AWS::S3::Bucket',
        },
      ])
      .build();
    const findingMediumOne = FindingMother.basic()
      .withId('tool#2')
      .withSeverity(SeverityType.Medium)
      .withResources([
        {
          name: 'resource-medium-1',
          region: 'us-east-1',
          type: 'AWS::S3::Bucket',
        },
      ])
      .build();
    const findingMediumTwo = FindingMother.basic()
      .withId('tool#3')
      .withSeverity(SeverityType.Medium)
      .withResources([
        {
          name: 'resource-medium-2',
          region: 'eu-west-1',
          type: 'AWS::S3::Bucket',
        },
      ])
      .build();
    for (const finding of [findingHigh, findingMediumOne, findingMediumTwo]) {
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding,
      });
    }

    const result = await useCase.getAssessmentGraph(
      GetAssessmentGraphUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .build(),
    );

    expect(result).toEqual({
      severity: {
        high: 1,
        medium: 2,
      },
      resources: {
        region: {
          'us-east-1': 2,
          'eu-west-1': 1,
        },
        type: {
          'aws::s3::bucket': 3,
        },
      },
      findings: 3,
    });
  });

  it('returns empty aggregations and zero findings when no data is stored', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const result = await useCase.getAssessmentGraph(
      GetAssessmentGraphUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .build(),
    );

    expect(result).toEqual({
      severity: {},
      resources: {
        region: {},
        type: {},
      },
      findings: 0,
    });
  });

  it('calls repository with provided version when version is specified', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const assessment = AssessmentMother.basic()
      .withLatestVersionNumber(3)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const getSpy = vitest.spyOn(fakeAssessmentsRepository, 'get');
    const aggregateSpy = vitest.spyOn(fakeFindingsRepository, 'aggregateAll');
    const countSpy = vitest.spyOn(fakeFindingsRepository, 'countAll');

    await useCase.getAssessmentGraph(
      GetAssessmentGraphUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withVersion(2)
        .build(),
    );

    expect(getSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2 }),
    );
    expect(aggregateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2 }),
    );
    expect(countSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2 }),
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetAssessmentGraphUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
