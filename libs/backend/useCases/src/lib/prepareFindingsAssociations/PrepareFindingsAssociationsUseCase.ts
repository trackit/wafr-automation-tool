import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentGraphData,
  ScanFinding,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { tokenGetScannedFindingsUseCase } from '../getScannedFindings';
import {
  ScanFindingsBestPracticesMapping,
  tokenMapScanFindingsToBestPracticesUseCase,
} from '../mapScanFindingsToBestPractices';
import { tokenStoreFindingsToAssociateUseCase } from '../storeFindingsToAssociate';

export interface PrepareFindingsAssociationsUseCaseArgs {
  assessmentId: string;
  scanningTool: ScanningTool;
  regions: string[];
  workflows: string[];
  organizationDomain: string;
}

export interface PrepareFindingsAssociationsUseCase {
  prepareFindingsAssociations(
    args: PrepareFindingsAssociationsUseCaseArgs,
  ): Promise<string[]>;
}

export class PrepareFindingsAssociationsUseCaseImpl
  implements PrepareFindingsAssociationsUseCase
{
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly getScannedFindingsUseCase = inject(
    tokenGetScannedFindingsUseCase,
  );
  private readonly mapScanFindingsToBestPracticesUseCase = inject(
    tokenMapScanFindingsToBestPracticesUseCase,
  );
  private readonly storeFindingsToAssociateUseCase = inject(
    tokenStoreFindingsToAssociateUseCase,
  );

  private formatScanningToolGraphData(
    findings: ScanFinding[],
  ): AssessmentGraphData {
    return {
      findings: findings.length,
      regions: findings.reduce<Record<string, number>>((regions, finding) => {
        if (!finding.resources) return regions;
        return finding.resources.reduce((regionsAcc, resource) => {
          if (!resource.region) return regionsAcc;
          regionsAcc[resource.region] = (regionsAcc[resource.region] ?? 0) + 1;
          return regionsAcc;
        }, regions);
      }, {}),
      resourceTypes: findings.reduce<Record<string, number>>(
        (resourceTypes, finding) => {
          if (!finding.resources) return resourceTypes;
          return finding.resources.reduce((resourceTypesAcc, resource) => {
            if (!resource.type) return resourceTypesAcc;
            resourceTypesAcc[resource.type] =
              (resourceTypesAcc[resource.type] ?? 0) + 1;
            return resourceTypesAcc;
          }, resourceTypes);
        },
        {},
      ),
      severities: findings.reduce<Partial<Record<SeverityType, number>>>(
        (severities, finding) => {
          if (!finding.severity) return severities;
          severities[finding.severity] =
            (severities[finding.severity] ?? 0) + 1;
          return severities;
        },
        {},
      ),
    };
  }

  private async storeMappedScanFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    scanFindingsToBestPractices: ScanFindingsBestPracticesMapping;
  }): Promise<void> {
    const { assessmentId, organizationDomain, scanFindingsToBestPractices } =
      args;

    const bestPractices = scanFindingsToBestPractices.reduce<
      Map<
        string,
        {
          bestPractice: {
            pillarId: string;
            questionId: string;
            bestPracticeId: string;
          };
          findingIds: Set<string>;
        }
      >
    >((acc, { scanFinding, bestPractices: mappedBestPractices }) => {
      mappedBestPractices.forEach((bestPractice) => {
        const key = `${bestPractice.pillarId}:${bestPractice.questionId}:${bestPractice.bestPracticeId}`;
        let entry = acc.get(key);
        if (!entry) {
          entry = {
            bestPractice,
            findingIds: new Set<string>(),
          };
          acc.set(key, entry);
        }
        entry.findingIds.add(scanFinding.id);
      });
      return acc;
    }, new Map());

    await Promise.all(
      scanFindingsToBestPractices.map(async ({ scanFinding }) => {
        await this.findingsRepository.save({
          assessmentId,
          organizationDomain,
          finding: {
            ...scanFinding,
            isAIAssociated: false,
            hidden: false,
            comments: [],
            bestPractices: [],
          },
        });
      }),
    );
    await Promise.all(
      Array.from(bestPractices.values()).map(
        async ({ bestPractice, findingIds }) => {
          await this.findingsRepository.saveBestPracticeFindings({
            assessmentId,
            organizationDomain,
            pillarId: bestPractice.pillarId,
            questionId: bestPractice.questionId,
            bestPracticeId: bestPractice.bestPracticeId,
            bestPracticeFindingIds: findingIds,
          });
        },
      ),
    );
  }

  public async prepareFindingsAssociations(
    args: PrepareFindingsAssociationsUseCaseArgs,
  ): Promise<string[]> {
    const { assessmentId, scanningTool, organizationDomain } = args;
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

    const scanFindings =
      await this.getScannedFindingsUseCase.getScannedFindings(args);
    const questionSet = this.questionSetService.get();
    const scanFindingsToBestPractices =
      await this.mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices(
        {
          pillars: questionSet.pillars,
          scanFindings,
        },
      );
    await this.assessmentsRepository.updateRawGraphDataForScanningTool({
      assessmentId,
      organizationDomain,
      scanningTool,
      graphData: this.formatScanningToolGraphData(scanFindings),
    });

    const mappedScanFindingsToBestPractices =
      scanFindingsToBestPractices.filter(
        (scanFindingToBestPractices) =>
          scanFindingToBestPractices.bestPractices.length > 0,
      );
    const nonMappedScanFindings = scanFindingsToBestPractices
      .filter(
        (scanFindingToBestPractices) =>
          scanFindingToBestPractices.bestPractices.length === 0,
      )
      .map(({ scanFinding }) => scanFinding);
    const [findingsChunksURIs] = await Promise.all([
      this.storeFindingsToAssociateUseCase.storeFindingsToAssociate({
        assessmentId,
        organizationDomain,
        scanningTool,
        scanFindings: nonMappedScanFindings,
      }),
      this.storeMappedScanFindings({
        assessmentId,
        organizationDomain,
        scanningTool,
        scanFindingsToBestPractices: mappedScanFindingsToBestPractices,
      }),
    ]);
    return findingsChunksURIs;
  }
}

export const tokenPrepareFindingsAssociationsUseCase =
  createInjectionToken<PrepareFindingsAssociationsUseCase>(
    'PrepareFindingsAssociationsUseCase',
    {
      useClass: PrepareFindingsAssociationsUseCaseImpl,
    },
  );
