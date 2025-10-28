import { ScanningTool } from '@backend/models';

import type { PrepareFindingsAssociationsInput } from './PrepareFindingsAssociationsAdapter';

export class PrepareFindingsAssociationsAdapterEventMother {
  private input: PrepareFindingsAssociationsInput;

  private constructor(input: PrepareFindingsAssociationsInput) {
    this.input = input;
  }

  public static basic(): PrepareFindingsAssociationsAdapterEventMother {
    return new PrepareFindingsAssociationsAdapterEventMother({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      scanningTool: ScanningTool.PROWLER,
      regions: [],
      workflows: [],
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): PrepareFindingsAssociationsAdapterEventMother {
    this.input.assessmentId = assessmentId;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool,
  ): PrepareFindingsAssociationsAdapterEventMother {
    this.input.scanningTool = scanningTool;
    return this;
  }

  public withRegions(
    regions: string[],
  ): PrepareFindingsAssociationsAdapterEventMother {
    this.input.regions = regions;
    return this;
  }

  public withWorkflows(
    workflows: string[],
  ): PrepareFindingsAssociationsAdapterEventMother {
    this.input.workflows = workflows;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): PrepareFindingsAssociationsAdapterEventMother {
    this.input.organizationDomain = organizationDomain;
    return this;
  }

  public build(): PrepareFindingsAssociationsInput {
    return this.input;
  }
}
