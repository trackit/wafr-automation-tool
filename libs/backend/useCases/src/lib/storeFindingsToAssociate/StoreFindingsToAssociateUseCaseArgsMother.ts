import { ScanFinding, ScanningTool } from '@backend/models';

import type { StoreFindingsToAssociateUseCaseArgs } from './StoreFindingsToAssociateUseCase';

export class StoreFindingsToAssociateUseCaseArgsMother {
  private data: StoreFindingsToAssociateUseCaseArgs;

  constructor(data: StoreFindingsToAssociateUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StoreFindingsToAssociateUseCaseArgsMother {
    return new StoreFindingsToAssociateUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'organization-id',
      scanningTool: ScanningTool.PROWLER,
      scanFindings: [],
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withScanningTool(
    scanningTool: ScanningTool,
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.scanningTool = scanningTool;
    return this;
  }

  public withScanFindings(
    scanFindings: ScanFinding[],
  ): StoreFindingsToAssociateUseCaseArgsMother {
    this.data.scanFindings = scanFindings;
    return this;
  }

  public build(): StoreFindingsToAssociateUseCaseArgs {
    return this.data;
  }
}
