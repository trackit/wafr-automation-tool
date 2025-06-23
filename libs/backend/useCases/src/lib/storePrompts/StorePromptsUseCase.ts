import { createInjectionToken, inject } from '@shared/di-container';
import { AIFinding, Finding, ScanFinding, ScanningTool } from '@backend/models';
import {
  tokenAssessmentsRepository,
  tokenObjectsStorage,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import { chunk } from '@shared/utils';
import { NotFoundError } from '../Errors';
import { AIBestPracticeService } from '../../services/AIBestPracticeService';

export interface StorePromptsUseCaseArgs {
  assessmentId: string;
  organization: string;
  scanningTool: ScanningTool;
  scanFindings: ScanFinding[];
}

export interface StorePromptsUseCase {
  storePrompts(args: StorePromptsUseCaseArgs): Promise<string[]>;
}

export class StorePromptsUseCaseImpl implements StorePromptsUseCase {
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly chunkSize = inject(tokenStorePromptsUseCaseChunkSize);

  static getFindingsChunkPath(args: {
    assessmentId: string;
    scanningTool: string;
    chunkIndex: number;
  }): string {
    const { assessmentId, scanningTool, chunkIndex } = args;
    return `assessments/${assessmentId}/chunks/${scanningTool}_${chunkIndex}.json`;
  }

  static getPromptVariablesChunkPath(args: {
    assessmentId: string;
    scanningTool: string;
    chunkIndex: number;
  }): string {
    const { assessmentId, scanningTool, chunkIndex } = args;
    return `assessments/${assessmentId}/prompts_variables/${scanningTool}_${chunkIndex}.json`;
  }

  private async storePromptVariablesChunks(args: {
    findingsChunks: Finding[][];
    assessmentId: string;
    scanningTool: ScanningTool;
  }): Promise<string[]> {
    const { findingsChunks, assessmentId, scanningTool } = args;
    const { pillars } = this.questionSetService.get();
    const aiBestPracticeMetadatas =
      AIBestPracticeService.createAIBestPracticeMetadatas({
        questionSetData: pillars,
      });
    return Promise.all(
      findingsChunks.map((findings, index) => {
        const aiFindings = findings.map<AIFinding>(
          ({ id, statusDetail, riskDetails }) => ({
            id,
            statusDetail: statusDetail ?? '',
            riskDetails: riskDetails ?? '',
          })
        );
        const promptVariables = {
          scanningToolTitle: scanningTool,
          scanningToolData: aiFindings,
          questionSetData: aiBestPracticeMetadatas,
        };
        return this.objectsStorage.put({
          key: StorePromptsUseCaseImpl.getPromptVariablesChunkPath({
            assessmentId,
            scanningTool,
            chunkIndex: index,
          }),
          body: JSON.stringify(promptVariables),
        });
      })
    );
  }

  private async storeFindingsChunks(args: {
    findingsChunks: Finding[][];
    assessmentId: string;
    scanningTool: ScanningTool;
  }): Promise<string[]> {
    const { findingsChunks, assessmentId, scanningTool } = args;
    return Promise.all(
      findingsChunks.map((findings, index) =>
        this.objectsStorage.put({
          key: StorePromptsUseCaseImpl.getFindingsChunkPath({
            assessmentId,
            scanningTool,
            chunkIndex: index,
          }),
          body: JSON.stringify(findings),
        })
      )
    );
  }

  public async storePrompts(args: StorePromptsUseCaseArgs): Promise<string[]> {
    const { assessmentId, organization, scanningTool, scanFindings } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organization,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found in organization ${organization}`
      );
    }
    const findings = scanFindings.map<Finding>((scanFinding) => ({
      ...scanFinding,
      isAiAssociated: true,
      hidden: false,
      bestPractices: '',
    }));
    const findingsChunks = chunk(findings, this.chunkSize);
    const [promptsURIs] = await Promise.all([
      this.storePromptVariablesChunks({
        findingsChunks,
        assessmentId,
        scanningTool,
      }),
      this.storeFindingsChunks({
        findingsChunks,
        assessmentId,
        scanningTool,
      }),
    ]);
    return promptsURIs;
  }
}

export const tokenStorePromptsUseCase =
  createInjectionToken<StorePromptsUseCase>('StorePromptsUseCase', {
    useClass: StorePromptsUseCaseImpl,
  });

export const tokenStorePromptsUseCaseChunkSize = createInjectionToken<number>(
  'StorePromptsUseCaseChunkSize',
  {
    useValue: 400,
  }
);
