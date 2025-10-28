import { tokenAssessmentsRepository } from '@backend/infrastructure';
import { ScanFinding, ScanningTool } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import {
  CloudCustodianScanProvider,
  CloudSploitScanProvider,
  ProwlerScanProvider,
  ScanProvider,
} from './ScanProvider';

export interface GetScannedFindingsArgs {
  assessmentId: string;
  organizationDomain: string;
  regions: string[];
  workflows: string[];
  scanningTool: ScanningTool;
}

export interface GetScannedFindingsUseCase {
  getScannedFindings(args: GetScannedFindingsArgs): Promise<ScanFinding[]>;
}

export class GetScannedFindingsUseCaseImpl
  implements GetScannedFindingsUseCase
{
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly scanProviderTypes: Record<
    ScanningTool,
    typeof ScanProvider
  > = {
    [ScanningTool.PROWLER]: ProwlerScanProvider,
    [ScanningTool.CLOUDSPLOIT]: CloudSploitScanProvider,
    [ScanningTool.CLOUD_CUSTODIAN]: CloudCustodianScanProvider,
  };

  public async getScannedFindings(
    args: GetScannedFindingsArgs,
  ): Promise<ScanFinding[]> {
    const {
      assessmentId,
      organizationDomain,
      regions,
      workflows,
      scanningTool,
    } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }
    const scanProvider = new this.scanProviderTypes[scanningTool](
      assessmentId,
      workflows,
      regions,
      scanningTool,
    );
    return scanProvider.getScannedFindings();
  }
}

export const tokenGetScannedFindingsUseCase =
  createInjectionToken<GetScannedFindingsUseCase>('GetScannedFindingsUseCase', {
    useClass: GetScannedFindingsUseCaseImpl,
  });
