import { ScanningTool } from '@backend/models';
import type { PreparePromptsUseCaseArgs } from './PreparePromptsUseCase';

export class PreparePromptsUseCaseArgsMother {
  private input: PreparePromptsUseCaseArgs;

  private constructor(input: PreparePromptsUseCaseArgs) {
    this.input = input;
  }

  public static basic(): PreparePromptsUseCaseArgsMother {
    return new PreparePromptsUseCaseArgsMother({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      scanningTool: ScanningTool.PROWLER,
      regions: [],
      workflows: [],
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): PreparePromptsUseCaseArgsMother {
    this.input.assessmentId = assessmentId;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): PreparePromptsUseCaseArgsMother {
    this.input.scanningTool = scanningTool;
    return this;
  }

  public withRegions(regions: string[]): PreparePromptsUseCaseArgsMother {
    this.input.regions = regions;
    return this;
  }

  public withWorkflows(workflows: string[]): PreparePromptsUseCaseArgsMother {
    this.input.workflows = workflows;
    return this;
  }

  public withOrganization(
    organization: string
  ): PreparePromptsUseCaseArgsMother {
    this.input.organization = organization;
    return this;
  }

  public build(): PreparePromptsUseCaseArgs {
    return this.input;
  }
}
