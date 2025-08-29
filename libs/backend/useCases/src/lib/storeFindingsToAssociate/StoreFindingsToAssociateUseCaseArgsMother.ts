import { ScanFinding, ScanningTool } from '@backend/models';

import type { StoreFindingsToAssociateUseCaseArgs } from './StoreFindingsToAssociateUseCase';

export class StoreFindingsToAssociateUseCaseArgsMother {
  private data: StoreFindingsToAssociateUseCaseArgs;

  constructor(data: StoreFindingsToAssociateUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StoreFindingsToAssociateUseCaseArgsMother {
    return new StoreFindingsToAssociateUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'organization-id',
      scanningTool: ScanningTool.PROWLER,
      scanFindings: [],
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public withScanFindings(
    scanFindings: ScanFinding[]
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.scanFindings = scanFindings;
    return this;
  }

  public build(): StoreFindingsToAssociateUseCaseArgs {
    return this.data;
  }
}
