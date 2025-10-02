import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentGraphData,
  Finding,
  Pillar,
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

  public formatPillarsForAssessmentUpdate(args: {
    rawPillars: Pillar[];
    scanFindingsToBestPractices: ScanFindingsBestPracticesMapping;
  }): Pillar[] {
    const { rawPillars, scanFindingsToBestPractices } = args;
    return rawPillars.map((pillar) => ({
      ...pillar,
      questions: pillar.questions.map((question) => ({
        ...question,
        bestPractices: question.bestPractices.map((bestPractice) => {
          const scanFindingsMatchingBestPractice = scanFindingsToBestPractices
            .filter((scanFindingToBestPractices) =>
              scanFindingToBestPractices.bestPractices.some(
                (bp) =>
                  bp.bestPracticeId === bestPractice.id &&
                  bp.questionId === question.id &&
                  bp.pillarId === pillar.id,
              ),
            )
            .map(({ scanFinding }) => scanFinding);
          return {
            ...bestPractice,
            results: new Set(
              scanFindingsMatchingBestPractice.map(({ id }) => id),
            ),
          };
        }),
      })),
    }));
  }

  private async saveMappedScanFindingsToBestPractices(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    scanFindingsToBestPractices: ScanFindingsBestPracticesMapping;
  }): Promise<void> {
    const { assessmentId, organizationDomain, scanFindingsToBestPractices } =
      args;
    const findings = scanFindingsToBestPractices.map<Finding>(
      ({ scanFinding, bestPractices }) => ({
        ...scanFinding,
        isAIAssociated: false,
        bestPractices: bestPractices
          .map((bp) => `${bp.pillarId}#${bp.questionId}#${bp.bestPracticeId}`)
          .join(', '),
        hidden: false,
        comments: [],
      }),
    );
    await Promise.all(
      findings.map((finding) =>
        this.findingsRepository.save({
          assessmentId,
          organizationDomain,
          finding,
        }),
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
    const updates = [
      this.assessmentsRepository.updateRawGraphDataForScanningTool({
        assessmentId,
        organizationDomain,
        scanningTool,
        graphData: this.formatScanningToolGraphData(scanFindings),
      }),
    ];
    if (scanningTool === ScanningTool.PROWLER) {
      updates.push(
        this.assessmentsRepository.update({
          assessmentId,
          organizationDomain,
          assessmentBody: {
            pillars: this.formatPillarsForAssessmentUpdate({
              rawPillars: questionSet.pillars,
              scanFindingsToBestPractices,
            }),
            questionVersion: questionSet.version,
          },
        }),
      );
    }
    await Promise.all(updates);

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
      this.saveMappedScanFindingsToBestPractices({
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
