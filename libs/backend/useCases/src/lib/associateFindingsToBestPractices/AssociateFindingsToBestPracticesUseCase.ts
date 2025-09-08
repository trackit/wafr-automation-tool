import {
  tokenAssessmentsRepository,
  tokenFindingToBestPracticesAssociationService,
  tokenLogger,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import type { Assessment, Finding, ScanningTool } from '@backend/models';
import { FindingToBestPracticesAssociation } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { assertBestPracticeExists } from '../../services/asserts';

export type AssociateFindingsToBestPracticesUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
  scanningTool: ScanningTool;
  findings: Finding[];
};

export interface AssociateFindingsToBestPracticesUseCase {
  associateFindingsToBestPractices(
    args: AssociateFindingsToBestPracticesUseCaseArgs
  ): Promise<void>;
}

export class AssociateFindingsToBestPracticesUseCaseImpl
  implements AssociateFindingsToBestPracticesUseCase
{
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly findingToBestPracticesAssociationService = inject(
    tokenFindingToBestPracticesAssociationService
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async storeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingsAssociations } = args;
    await Promise.all(
      findingsAssociations
        .filter(({ bestPractices }) => bestPractices.length > 0)
        .map((association) =>
          this.assessmentsRepository.saveFinding({
            assessmentId,
            organizationDomain,
            finding: {
              ...association.finding,
              bestPractices: association.bestPractices
                .map(
                  ({ pillarId, questionId, bestPracticeId }) =>
                    `${pillarId}#${questionId}#${bestPracticeId}`
                )
                .join(','),
              isAIAssociated: true,
            },
          })
        )
    );
  }

  public async addFindingsToBestPractices(args: {
    assessment: Assessment;
    organizationDomain: string;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessment, organizationDomain, findingsAssociations } = args;
    const bestPracticesFindingIds = findingsAssociations.reduce(
      (acc, associations) => {
        for (const bestPractice of associations.bestPractices) {
          const key = `${bestPractice.pillarId}#${bestPractice.questionId}#${bestPractice.bestPracticeId}`;
          if (!acc.has(key)) {
            acc.set(key, new Set([]));
          }
          acc.get(key)?.add(associations.finding.id);
        }
        return acc;
      },
      new Map<string, Set<string>>()
    );

    await Promise.all(
      Array.from(bestPracticesFindingIds.entries()).map(([key, findingIds]) => {
        const [pillarId, questionId, bestPracticeId] = key.split('#');
        assertBestPracticeExists({
          assessment,
          pillarId,
          questionId,
          bestPracticeId,
        });
        return this.assessmentsRepository.addBestPracticeFindings({
          assessmentId: assessment.id,
          organizationDomain,
          pillarId,
          questionId,
          bestPracticeId,
          bestPracticeFindingIds: findingIds,
        });
      })
    );
  }

  public async storeFindingsAssociations(args: {
    assessment: Assessment;
    organizationDomain: string;
    scanningTool: ScanningTool;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessment, organizationDomain, findingsAssociations } = args;
    this.logger.info(
      `Storing findings associations for assessment ${assessment.id} and organization ${organizationDomain}`
    );
    await Promise.all([
      this.storeFindings({
        assessmentId: assessment.id,
        organizationDomain,
        findingsAssociations,
      }),
      this.addFindingsToBestPractices({
        assessment,
        organizationDomain,
        findingsAssociations,
      }),
    ]);
  }

  public async associateFindingsToBestPractices(
    args: AssociateFindingsToBestPracticesUseCaseArgs
  ): Promise<void> {
    const { assessmentId, organizationDomain, scanningTool, findings } = args;
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
    const { pillars } = this.questionSetService.get();
    this.logger.info(
      `Associating findings to best practices for assessment ${assessmentId} and organization ${organizationDomain}`
    );
    const findingsAssociations =
      await this.findingToBestPracticesAssociationService.associateFindingsToBestPractices(
        {
          scanningTool,
          findings,
          pillars,
        }
      );
    await this.storeFindingsAssociations({
      assessment,
      organizationDomain,
      scanningTool,
      findingsAssociations,
    });
  }
}

export const tokenAssociateFindingsToBestPracticesUseCase =
  createInjectionToken<AssociateFindingsToBestPracticesUseCase>(
    'AssociateFindingsToBestPracticesUseCase',
    {
      useClass: AssociateFindingsToBestPracticesUseCaseImpl,
    }
  );
