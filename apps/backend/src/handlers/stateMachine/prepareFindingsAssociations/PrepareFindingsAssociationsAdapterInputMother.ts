import { ScanningTool } from '@backend/models';
import type { PrepareFindingsAssociationsInput } from './PrepareFindingsAssociationsAdapter';

export class PrepareFindingsAssociationsAdapterInputMother {
  private input: PrepareFindingsAssociationsInput;

  private constructor(input: PrepareFindingsAssociationsInput) {
    this.input = input;
  }

  public static basic(): PrepareFindingsAssociationsAdapterInputMother {
    return new PrepareFindingsAssociationsAdapterInputMother({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      scanningTool: ScanningTool.PROWLER,
      regions: [],
      workflows: [],
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): PrepareFindingsAssociationsAdapterInputMother {
    this.input.assessmentId = assessmentId;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): PrepareFindingsAssociationsAdapterInputMother {
    this.input.scanningTool = scanningTool;
    return this;
  }

  public withRegions(
    regions: string[]
  ): PrepareFindingsAssociationsAdapterInputMother {
    this.input.regions = regions;
    return this;
  }

  public withWorkflows(
    workflows: string[]
  ): PrepareFindingsAssociationsAdapterInputMother {
    this.input.workflows = workflows;
    return this;
  }

  public withOrganization(
    organization: string
  ): PrepareFindingsAssociationsAdapterInputMother {
    this.input.organization = organization;
    return this;
  }

  public build(): PrepareFindingsAssociationsInput {
    return this.input;
  }
}
