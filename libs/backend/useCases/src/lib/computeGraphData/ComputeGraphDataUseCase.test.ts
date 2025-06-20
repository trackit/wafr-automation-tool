import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentGraphDatasMother,
  AssessmentMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import {
  ComputeGraphDataUseCaseArgs,
  ComputeGraphDataUseCaseImpl,
} from './ComputeGraphDataUseCase';
import { ComputeGraphDataUseCaseArgsMother } from './ComputeGraphDataUseCaseArgsMother';

describe('computeGraphData UseCase', () => {
  it('should compute the correct graph data', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const rawGraphDatas = {
      [ScanningTool.PROWLER]: AssessmentGraphDatasMother.basic()
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
      [ScanningTool.CLOUDSPLOIT]: AssessmentGraphDatasMother.basic()
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
      [ScanningTool.CLOUD_CUSTODIAN]:
        AssessmentGraphDatasMother.basic().build(),
    };
    const fakeAssessmentMother =
      AssessmentMother.basic().withRawGraphDatas(rawGraphDatas);
    const fakeAssessment = fakeAssessmentMother.build();
    await fakeAssessmentsRepository.save(fakeAssessment);

    await useCase.computeGraphData({
      assessmentId: fakeAssessment.id,
      organization: fakeAssessment.organization,
    });

    expect(fakeAssessmentsRepository.assessments).toEqual({
      [`${fakeAssessment.id}#${fakeAssessment.organization}`]:
        fakeAssessmentMother
          .withGraphDatas({
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

  it('should throw a NotFoundError if the assessment doesn’t exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};

    const input: ComputeGraphDataUseCaseArgs =
      ComputeGraphDataUseCaseArgsMother.basic().build();

    await expect(useCase.computeGraphData(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if the assessment exists for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const fakeAssessment = AssessmentMother.basic()
      .withId('b56781c9-021d-421e-bd79-85836367d449')
      .withOrganization('other-org.io')
      .build();
    fakeAssessmentsRepository.save(fakeAssessment);

    const input: ComputeGraphDataUseCaseArgs =
      ComputeGraphDataUseCaseArgsMother.basic()
        .withAssessmentId('b56781c9-021d-421e-bd79-85836367d449')
        .withOrganization('test.io')
        .build();

    await expect(useCase.computeGraphData(input)).rejects.toThrow(
      NotFoundError
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
