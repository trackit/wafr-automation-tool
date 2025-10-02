import { type Finding, ScanningTool } from '@backend/models';

import type { AssociateFindingsToBestPracticesUseCaseArgs } from './AssociateFindingsToBestPracticesUseCase';

export class AssociateFindingsToBestPracticesUseCaseArgsMother {
  private data: AssociateFindingsToBestPracticesUseCaseArgs;

  private constructor(data: AssociateFindingsToBestPracticesUseCaseArgs) {
    this.data = data;
  }

  public static basic(): AssociateFindingsToBestPracticesUseCaseArgsMother {
    return new AssociateFindingsToBestPracticesUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      scanningTool: ScanningTool.PROWLER,
      findings: [],
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool,
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public withFindings(
    findings: Finding[],
  ): AssociateFindingsToBestPracticesUseCaseArgsMother {
    this.data.findings = findings;
    return this;
  }

  public build(): AssociateFindingsToBestPracticesUseCaseArgs {
    return this.data;
  }
}
