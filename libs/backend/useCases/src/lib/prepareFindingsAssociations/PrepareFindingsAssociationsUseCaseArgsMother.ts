import { ScanningTool } from '@backend/models';

import type { PrepareFindingsAssociationsUseCaseArgs } from './PrepareFindingsAssociationsUseCase';

export class PrepareFindingsAssociationsUseCaseArgsMother {
  private input: PrepareFindingsAssociationsUseCaseArgs;

  private constructor(input: PrepareFindingsAssociationsUseCaseArgs) {
    this.input = input;
  }

  public static basic(): PrepareFindingsAssociationsUseCaseArgsMother {
    return new PrepareFindingsAssociationsUseCaseArgsMother({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      scanningTool: ScanningTool.PROWLER,
      regions: [],
      workflows: [],
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): PrepareFindingsAssociationsUseCaseArgsMother {
    this.input.assessmentId = assessmentId;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): PrepareFindingsAssociationsUseCaseArgsMother {
    this.input.scanningTool = scanningTool;
    return this;
  }

  public withRegions(
    regions: string[]
  ): PrepareFindingsAssociationsUseCaseArgsMother {
    this.input.regions = regions;
    return this;
  }

  public withWorkflows(
    workflows: string[]
  ): PrepareFindingsAssociationsUseCaseArgsMother {
    this.input.workflows = workflows;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string
  ): PrepareFindingsAssociationsUseCaseArgsMother {
    this.input.organizationDomain = organizationDomain;
    return this;
  }

  public build(): PrepareFindingsAssociationsUseCaseArgs {
    return this.input;
  }
}
