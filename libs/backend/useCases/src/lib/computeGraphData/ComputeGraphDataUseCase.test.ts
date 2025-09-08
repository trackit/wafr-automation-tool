import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentGraphDataMother,
  AssessmentMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { ComputeGraphDataUseCaseImpl } from './ComputeGraphDataUseCase';
import { ComputeGraphDataUseCaseArgsMother } from './ComputeGraphDataUseCaseArgsMother';

describe('computeGraphData UseCase', () => {
  it('should compute the correct graph data', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const rawGraphData = {
      [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic()
        .withFindings(150)
        .withResourceTypes({
          AwsAccount: 4,
          AwsEc2Instance: 1,
          AwsIamUser: 10,
          AwsS3Bucket: 200,
        })
        .withRegions({
          'us-west-2': 30,
          'us-east-1': 10,
        })
        .withSeverities({
          [SeverityType.Critical]: 15,
          [SeverityType.High]: 50,
          [SeverityType.Medium]: 15,
          [SeverityType.Low]: 10,
        })
        .build(),
      [ScanningTool.CLOUDSPLOIT]: AssessmentGraphDataMother.basic()
        .withFindings(300)
        .withResourceTypes({
          AwsAccount: 4,
          AwsIamUser: 30,
          AwsS3Bucket: 20,
          AwsS3BucketPolicy: 10,
        })
        .withRegions({
          'us-west-2': 200,
          'us-east-1': 20,
        })
        .withSeverities({
          [SeverityType.Critical]: 10,
          [SeverityType.High]: 20,
          [SeverityType.Medium]: 30,
          [SeverityType.Low]: 40,
        })
        .build(),
      [ScanningTool.CLOUD_CUSTODIAN]: AssessmentGraphDataMother.basic().build(),
    };
    const fakeAssessmentMother =
      AssessmentMother.basic().withRawGraphData(rawGraphData);
    const fakeAssessment = fakeAssessmentMother.build();
    await fakeAssessmentsRepository.save(fakeAssessment);

    await useCase.computeGraphData({
      assessmentId: fakeAssessment.id,
      organization: fakeAssessment.organization,
    });

    expect(fakeAssessmentsRepository.assessments).toEqual({
      [`${fakeAssessment.id}#${fakeAssessment.organization}`]:
        fakeAssessmentMother
          .withGraphData({
            findings: 450,
            regions: {
              'us-east-1': 30,
              'us-west-2': 230,
            },
            resourceTypes: {
              AwsAccount: 8,
              AwsEc2Instance: 1,
              AwsIamUser: 40,
              AwsS3Bucket: 220,
              AwsS3BucketPolicy: 10,
            },
            severities: {
              Critical: 25,
              High: 70,
              Low: 50,
              Medium: 45,
            },
          })
          .build(),
    });
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = ComputeGraphDataUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.computeGraphData(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new ComputeGraphDataUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
