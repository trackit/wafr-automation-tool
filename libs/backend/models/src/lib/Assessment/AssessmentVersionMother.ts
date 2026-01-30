import type { Pillar } from '../Pillar';
import { type AssessmentVersion } from './AssessmentVersion';

export class AssessmentVersionMother {
  private data: AssessmentVersion;

  private constructor(data: AssessmentVersion) {
    this.data = data;
  }

  public static basic(): AssessmentVersionMother {
    return new AssessmentVersionMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      version: 1,
      createdAt: new Date(),
      createdBy: 'user-id',
      executionArn:
        'arn:aws:states:us-west-2:123456789012:execution:state-machine:execution-arn',
      pillars: [],
      finishedAt: undefined,
      error: undefined,
      wafrWorkloadArn: undefined,
      exportRegion: undefined,
    });
  }

  public withAssessmentId(id: string): AssessmentVersionMother {
    this.data.assessmentId = id;
    return this;
  }

  public withVersion(version: number): AssessmentVersionMother {
    this.data.version = version;
    return this;
  }

  public withCreatedAt(createdAt: Date): AssessmentVersionMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public withCreatedBy(createdBy: string): AssessmentVersionMother {
    this.data.createdBy = createdBy;
    return this;
  }

  public withExecutionArn(executionArn: string): AssessmentVersionMother {
    this.data.executionArn = executionArn;
    return this;
  }

  public withPillars(pillars: Pillar[] | undefined): AssessmentVersionMother {
    this.data.pillars = pillars;
    return this;
  }

  public withExportRegion(
    exportRegion: string | undefined,
  ): AssessmentVersionMother {
    this.data.exportRegion = exportRegion;
    return this;
  }

  public withWAFRWorkloadArn(
    wafrWorkloadArn: string | undefined,
  ): AssessmentVersionMother {
    this.data.wafrWorkloadArn = wafrWorkloadArn;
    return this;
  }

  public withFinishedAt(finishedAt: Date | undefined): AssessmentVersionMother {
    this.data.finishedAt = finishedAt;
    return this;
  }

  public withError(
    error: { cause: string; error: string } | undefined,
  ): AssessmentVersionMother {
    this.data.error = error;
    return this;
  }

  public build(): AssessmentVersion {
    return this.data;
  }
}
