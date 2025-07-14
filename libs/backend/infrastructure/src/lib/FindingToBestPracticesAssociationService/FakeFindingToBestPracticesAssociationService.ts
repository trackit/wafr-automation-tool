import type { Finding, Pillar, ScanningTool } from '@backend/models';
import type {
  FindingToBestPracticesAssociation,
  FindingToBestPracticesAssociationService,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeFindingToBestPracticesAssociationService
  implements FindingToBestPracticesAssociationService
{
  public async associateFindingsToBestPractices(args: {
    scanningTool: ScanningTool;
    findings: Finding[];
    pillars: Pillar[];
  }): Promise<FindingToBestPracticesAssociation[]> {
    return args.findings.map((finding) => ({
      finding,
      bestPractices: [],
    }));
  }
}

export const tokenFakeFindingToBestPracticesAssociationService =
  createInjectionToken<FakeFindingToBestPracticesAssociationService>(
    'FakeFindingToBestPracticesAssociationService',
    { useClass: FakeFindingToBestPracticesAssociationService }
  );
