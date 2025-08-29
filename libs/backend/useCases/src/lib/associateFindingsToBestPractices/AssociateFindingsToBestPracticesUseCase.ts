import {
  tokenAssessmentsRepository,
  tokenFindingToBestPracticesAssociationService,
  tokenLogger,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import type { Finding, ScanningTool } from '@backend/models';
import { FindingToBestPracticesAssociation } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { NotFoundError } from '../Errors';

export type AssociateFindingsToBestPracticesUseCaseArgs = {
  assessmentId: string;
  organization: string;
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
    organization: string;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessmentId, organization, findingsAssociations } = args;
    await Promise.all(
      findingsAssociations
        .filter(({ bestPractices }) => bestPractices.length > 0)
        .map((association) =>
          this.assessmentsRepository.saveFinding({
            assessmentId,
            organization,
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
    assessmentId: string;
    organization: string;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessmentId, organization, findingsAssociations } = args;
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
        return this.assessmentsRepository.addBestPracticeFindings({
          assessmentId,
          organization,
          pillarId,
          questionId,
          bestPracticeId,
          bestPracticeFindingIds: findingIds,
        });
      })
    );
  }

  public async storeFindingsAssociations(args: {
    assessmentId: string;
    organization: string;
    scanningTool: ScanningTool;
    findingsAssociations: FindingToBestPracticesAssociation[];
  }): Promise<void> {
    const { assessmentId, organization, findingsAssociations } = args;
    this.logger.info(
      `Storing findings associations for assessment ${assessmentId} and organization ${organization}`
    );
    await Promise.all([
      this.storeFindings({
        assessmentId,
        organization,
        findingsAssociations,
      }),
      this.addFindingsToBestPractices({
        assessmentId,
        organization,
        findingsAssociations,
      }),
    ]);
  }

  public async associateFindingsToBestPractices(
    args: AssociateFindingsToBestPracticesUseCaseArgs
  ): Promise<void> {
    const { assessmentId, organization, scanningTool, findings } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.organization,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${organization}`
      );
    }
    const { pillars } = await this.questionSetService.get();
    this.logger.info(
      `Associating findings to best practices for assessment ${assessmentId} and organization ${organization}`
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
      assessmentId,
      organization,
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
