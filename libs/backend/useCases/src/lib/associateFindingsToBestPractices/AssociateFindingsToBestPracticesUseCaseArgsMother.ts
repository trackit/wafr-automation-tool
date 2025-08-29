import { type Finding, ScanningTool } from '@backend/models';

import type { AssociateFindingsToBestPracticesUseCaseArgs } from './AssociateFindingsToBestPracticesUseCase';

export class AssociateFindingsToBestPracticesUseCaseArgsMother {
  private data: AssociateFindingsToBestPracticesUseCaseArgs;

  private constructor(data: AssociateFindingsToBestPracticesUseCaseArgs) {
    this.data = data;
  }

  public static basic(): AssociateFindingsToBestPracticesUseCaseArgsMother {
    return new AssociateFindingsToBestPracticesUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      scanningTool: ScanningTool.PROWLER,
      findings: [],
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public withFindings(
    findings: Finding[]
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.findings = findings;
    return this;
  }

  public build(): AssociateFindingsToBestPracticesUseCaseArgs {
    return this.data;
  }
}
