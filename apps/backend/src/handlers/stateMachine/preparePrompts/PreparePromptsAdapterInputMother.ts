import { ScanningTool } from '@backend/models';
import type { PreparePromptsInput } from './PreparePromptsAdapter';

export class PreparePromptsAdapterInputMother {
  private input: PreparePromptsInput;

  private constructor(input: PreparePromptsInput) {
    this.input = input;
  }

  public static basic(): PreparePromptsAdapterInputMother {
    return new PreparePromptsAdapterInputMother({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      scanningTool: ScanningTool.PROWLER,
      regions: [],
      workflows: [],
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): PreparePromptsAdapterInputMother {
    this.input.assessmentId = assessmentId;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): PreparePromptsAdapterInputMother {
    this.input.scanningTool = scanningTool;
    return this;
  }

  public withRegions(regions: string[]): PreparePromptsAdapterInputMother {
    this.input.regions = regions;
    return this;
  }

  public withWorkflows(workflows: string[]): PreparePromptsAdapterInputMother {
    this.input.workflows = workflows;
    return this;
  }

  public withOrganization(
    organization: string
  ): PreparePromptsAdapterInputMother {
    this.input.organization = organization;
    return this;
  }

  public build(): PreparePromptsInput {
    return this.input;
  }
}
