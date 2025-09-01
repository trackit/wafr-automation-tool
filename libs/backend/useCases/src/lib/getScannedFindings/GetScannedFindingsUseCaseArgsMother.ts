import { ScanningTool } from '@backend/models';

import { GetScannedFindingsArgs } from './GetScannedFindingsUseCase';

export class GetScannedFindingsUseCaseArgsMother {
  private data: GetScannedFindingsArgs;

  private constructor(data: GetScannedFindingsArgs) {
    this.data = data;
  }

  public static basic(): GetScannedFindingsUseCaseArgsMother {
    return new GetScannedFindingsUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'organization.io',
      regions: [],
      workflows: [],
      scanningTool: ScanningTool.PROWLER,
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetScannedFindingsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): GetScannedFindingsUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withRegions(regions: string[]): GetScannedFindingsUseCaseArgsMother {
    this.data.regions = regions;
    return this;
  }

  public withWorkflows(
    workflows: string[]
  ): GetScannedFindingsUseCaseArgsMother {
    this.data.workflows = workflows;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): GetScannedFindingsUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public build(): GetScannedFindingsArgs {
    return this.data;
  }
}
