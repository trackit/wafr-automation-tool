import {
  tokenAIBestPracticeService,
  tokenAssessmentsRepository,
  tokenLogger,
  tokenObjectsStorage,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import {
  AIBestPracticeAssociation,
  AIFindingAssociation,
  Finding,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { parseJson } from '@shared/utils';

export type StoreResultsUseCaseArgs = {
  assessmentId: string;
  organization: string;
  promptUri: string;
  aiFindingAssociations: AIFindingAssociation[];
};

export interface StoreResultsUseCase {
  storeResults(args: StoreResultsUseCaseArgs): Promise<void>;
}

export class StoreResultsUseCaseImpl implements StoreResultsUseCase {
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly aiBestPracticeService = inject(tokenAIBestPracticeService);
  private readonly logger = inject(tokenLogger);

  public parseKey(chunkFileName: string): {
    scanningTool: string;
    chunkId: string;
  } {
    const chunkFileNameWithoutExtension = chunkFileName.split('.')[0];
    const [scanningTool, chunkId] = chunkFileNameWithoutExtension.split('_');
    return { scanningTool, chunkId };
  }

  public async retrieveFindings(
    assessmentId: string,
    chunkFileNameWithoutExtension: string
  ): Promise<Finding[]> {
    const key = `assessments/${assessmentId}/chunks/${chunkFileNameWithoutExtension}.json`;
    const chunkContent = await this.objectsStorage.get({ key });
    return parseJson(chunkContent) as unknown as Finding[];
  }

  public async storeBestPractices(
    assessmentId: string,
    organization: string,
    scanningTool: string,
    aiAssociations: AIFindingAssociation[],
    aiBestPracticeAssociations: Record<string, AIBestPracticeAssociation>
  ) {
    for (const aiAssociation of aiAssociations) {
      const aiBestPracticeAssociation =
        aiBestPracticeAssociations[aiAssociation.id];
      if (!aiBestPracticeAssociation) {
        throw new Error(
          `Best practice association for AI finding ${aiAssociation.id} not found`
        );
      }
      aiBestPracticeAssociation.bestPracticeFindingNumberIds = Array.from(
        { length: aiAssociation.end - aiAssociation.start + 1 },
        (_, index) => aiAssociation.start + index
      );
      if (aiBestPracticeAssociation.bestPracticeFindingNumberIds.length === 0) {
        continue;
      }
      await this.assessmentsRepository.updateBestPracticeFindings({
        assessmentId,
        organization,
        pillarId: aiBestPracticeAssociation.pillarId,
        questionId: aiBestPracticeAssociation.questionId,
        bestPracticeId: aiBestPracticeAssociation.bestPracticeId,
        bestPracticeFindingIds:
          aiBestPracticeAssociation.bestPracticeFindingNumberIds.map(
            (id) => `${scanningTool}#${id}`
          ),
      });
    }
  }

  public async storeFindings(
    assessmentId: string,
    organization: string,
    findings: Finding[],
    aiBestPracticeAssociations: Record<string, AIBestPracticeAssociation>
  ) {
    for (const finding of findings) {
      const findingNumberId = parseInt(finding.id.split('#')[1]);
      finding.bestPractices = Object.values(aiBestPracticeAssociations)
        .filter((bestPracticeInfo) =>
          bestPracticeInfo.bestPracticeFindingNumberIds?.includes(
            findingNumberId
          )
        )
        .map(
          (bestPracticeInfo) =>
            `${bestPracticeInfo.pillarId}#${bestPracticeInfo.questionId}#${bestPracticeInfo.bestPracticeId}`
        )
        .join(',');
      if (finding.bestPractices.length === 0) {
        continue;
      }
      finding.isAiAssociated = true;
      await this.assessmentsRepository.saveFinding({
        assessmentId,
        organization,
        finding,
      });
    }
  }

  public async storeResults(args: StoreResultsUseCaseArgs): Promise<void> {
    const { assessmentId, organization, promptUri, aiFindingAssociations } =
      args;
    const { key } = this.objectsStorage.parseURI(promptUri);
    const chunkFileArray = key.split('/');
    const chunkFileName = chunkFileArray[chunkFileArray.length - 1];
    const { scanningTool, chunkId } = this.parseKey(chunkFileName);
    const findings = await this.retrieveFindings(
      assessmentId,
      `${scanningTool}_${chunkId}`
    );
    this.logger.info(`StoreResults#${scanningTool}`, {
      assessmentId,
      organization,
      chunkFileName,
      findings,
    });

    const questionSet = this.questionSetService.get();
    const aiBestPracticeAssociations =
      this.aiBestPracticeService.createAIBestPracticeAssociations({
        questionSet: questionSet.data,
      });
    await this.storeBestPractices(
      assessmentId,
      organization,
      scanningTool,
      aiFindingAssociations,
      aiBestPracticeAssociations
    );
    await this.storeFindings(
      assessmentId,
      organization,
      findings,
      aiBestPracticeAssociations
    );
  }
}

export const tokenStoreResultsUseCase =
  createInjectionToken<StoreResultsUseCase>('StoreResultsUseCase', {
    useClass: StoreResultsUseCaseImpl,
  });
