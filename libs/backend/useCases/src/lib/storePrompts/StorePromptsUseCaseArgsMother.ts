import { ScanFinding, ScanningTool } from '@backend/models';
import type { StorePromptsUseCaseArgs } from './StorePromptsUseCase';

export class StorePromptsUseCaseArgsMother {
  private data: StorePromptsUseCaseArgs;

  constructor(data: StorePromptsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StorePromptsUseCaseArgsMother {
    return new StorePromptsUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'organization-id',
      scanningTool: ScanningTool.PROWLER,
      scanFindings: [],
    });
  }

  public withAssessmentId(assessmentId: string): StorePromptsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(organization: string): StorePromptsUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): StorePromptsUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public withScanFindings(
    scanFindings: ScanFinding[]
  ): StorePromptsUseCaseArgsMother {
    this.data.scanFindings = scanFindings;
    return this;
  }

  public build(): StorePromptsUseCaseArgs {
    return this.data;
  }
}
