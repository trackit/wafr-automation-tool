import {
  tokenAssessmentsRepository,
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
import { tokenGetScannedFindingsUseCase } from '../getScannedFindings';
import {
  ScanFindingsBestPracticesMapping,
  tokenMapScanFindingsToBestPracticesUseCase,
} from '../mapScanFindingsToBestPractices';
import { tokenStorePromptsUseCase } from '../storePrompts';
import { NotFoundError } from '../Errors';

export interface PreparePromptsUseCaseArgs {
  assessmentId: string;
  scanningTool: ScanningTool;
  regions: string[];
  workflows: string[];
  organization: string;
}

export interface PreparePromptsUseCase {
  preparePrompts(args: PreparePromptsUseCaseArgs): Promise<string[]>;
}

export class PreparePromptsUseCaseImpl implements PreparePromptsUseCase {
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly getScannedFindingsUseCase = inject(
    tokenGetScannedFindingsUseCase
  );
  private readonly mapScanFindingsToBestPracticesUseCase = inject(
    tokenMapScanFindingsToBestPracticesUseCase
  );
  private readonly storePromptsUseCase = inject(tokenStorePromptsUseCase);

  private formatScanningToolGraphData(
    findings: ScanFinding[]
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
        {}
      ),
      severities: findings.reduce<Partial<Record<SeverityType, number>>>(
        (severities, finding) => {
          if (!finding.severity) return severities;
          severities[finding.severity] =
            (severities[finding.severity] ?? 0) + 1;
          return severities;
        },
        {}
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
                  bp.pillarId === pillar.id
              )
            )
            .map(({ scanFinding }) => scanFinding);
          return {
            ...bestPractice,
            results: new Set(
              scanFindingsMatchingBestPractice.map(({ id }) => id)
            ),
          };
        }),
      })),
    }));
  }

  private async saveMappedScanFindingsToBestPractices(args: {
    assessmentId: string;
    organization: string;
    scanningTool: ScanningTool;
    scanFindingsToBestPractices: ScanFindingsBestPracticesMapping;
  }): Promise<void> {
    const { assessmentId, organization, scanFindingsToBestPractices } = args;
    const findings = scanFindingsToBestPractices.map<Finding>(
      ({ scanFinding, bestPractices }) => ({
        ...scanFinding,
        isAiAssociated: false,
        bestPractices: bestPractices
          .map((bp) => `${bp.pillarId}#${bp.questionId}#${bp.bestPracticeId}`)
          .join(', '),
        hidden: false,
      })
    );
    await Promise.all(
      findings.map((finding) =>
        this.assessmentsRepository.saveFinding({
          assessmentId,
          organization,
          finding,
        })
      )
    );
  }

  public async preparePrompts(
    args: PreparePromptsUseCaseArgs
  ): Promise<string[]> {
    const { assessmentId, scanningTool, organization } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organization,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found in organization ${organization}`
      );
    }
    const scanFindings =
      await this.getScannedFindingsUseCase.getScannedFindings(args);
    const questionSet = this.questionSetService.get();
    const scanFindingsToBestPractices =
      await this.mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices(
        {
          pillars: questionSet.pillars,
          scanFindings,
        }
      );
    const updates = [
      this.assessmentsRepository.updateRawGraphDataForScanningTool({
        assessmentId,
        organization,
        scanningTool,
        graphData: this.formatScanningToolGraphData(scanFindings),
      }),
    ];
    if (scanningTool === ScanningTool.PROWLER) {
      updates.push(
        this.assessmentsRepository.update({
          assessmentId,
          organization,
          assessmentBody: {
            pillars: this.formatPillarsForAssessmentUpdate({
              rawPillars: questionSet.pillars,
              scanFindingsToBestPractices,
            }),
            questionVersion: questionSet.version,
          },
        })
      );
    }
    await Promise.all(updates);

    const mappedScanFindingsToBestPractices =
      scanFindingsToBestPractices.filter(
        (scanFindingToBestPractices) =>
          scanFindingToBestPractices.bestPractices.length > 0
      );
    const nonMappedScanFindings = scanFindingsToBestPractices
      .filter(
        (scanFindingToBestPractices) =>
          scanFindingToBestPractices.bestPractices.length === 0
      )
      .map(({ scanFinding }) => scanFinding);
    const [promptsURIs] = await Promise.all([
      this.storePromptsUseCase.storePrompts({
        assessmentId,
        organization,
        scanningTool,
        scanFindings: nonMappedScanFindings,
      }),
      this.saveMappedScanFindingsToBestPractices({
        assessmentId,
        organization,
        scanningTool,
        scanFindingsToBestPractices: mappedScanFindingsToBestPractices,
      }),
    ]);
    return promptsURIs;
  }
}

export const tokenPreparePromptsUseCase =
  createInjectionToken<PreparePromptsUseCase>('PreparePromptsUseCase', {
    useClass: PreparePromptsUseCaseImpl,
  });
