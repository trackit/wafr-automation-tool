import z from 'zod';

import {
  tokenAssessmentsRepository,
  tokenObjectsStorage,
} from '@backend/infrastructure';
import { Finding, ScanFinding, ScanningTool } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined, chunk } from '@shared/utils';

import { AssessmentNotFoundError } from '../../errors';

export interface StoreFindingsToAssociateUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  scanningTool: ScanningTool;
  scanFindings: ScanFinding[];
}

export interface StoreFindingsToAssociateUseCase {
  storeFindingsToAssociate(
    args: StoreFindingsToAssociateUseCaseArgs
  ): Promise<string[]>;
}

export class StoreFindingsToAssociateUseCaseImpl
  implements StoreFindingsToAssociateUseCase
{
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly chunkSize = inject(
    tokenStoreFindingsToAssociateUseCaseChunkSize
  );

  static getFindingsChunkPath(args: {
    assessmentId: string;
    scanningTool: string;
    chunkIndex: number;
  }): string {
    const { assessmentId, scanningTool, chunkIndex } = args;
    return `assessments/${assessmentId}/chunks/${scanningTool}_${chunkIndex}.json`;
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
          key: StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
            assessmentId,
            scanningTool,
            chunkIndex: index,
          }),
          body: JSON.stringify(findings),
        })
      )
    );
  }

  public async storeFindingsToAssociate(
    args: StoreFindingsToAssociateUseCaseArgs
  ): Promise<string[]> {
    const { assessmentId, organizationDomain, scanningTool, scanFindings } =
      args;
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
    const findings = scanFindings.map<Finding>((scanFinding) => ({
      ...scanFinding,
      isAIAssociated: true,
      hidden: false,
      bestPractices: [],
      comments: [],
    }));
    const findingsChunks = chunk(findings, this.chunkSize);
    const findingsChunksURIs = await this.storeFindingsChunks({
      findingsChunks,
      assessmentId,
      scanningTool,
    });
    return findingsChunksURIs;
  }
}

export const tokenStoreFindingsToAssociateUseCase =
  createInjectionToken<StoreFindingsToAssociateUseCase>(
    'StoreFindingsToAssociateUseCase',
    {
      useClass: StoreFindingsToAssociateUseCaseImpl,
    }
  );

export const tokenStoreFindingsToAssociateUseCaseChunkSize =
  createInjectionToken<number>('StoreFindingsToAssociateUseCaseChunkSize', {
    useFactory: () => {
      const chunkSize = process.env.AI_FINDINGS_ASSOCIATION_CHUNK_SIZE;
      assertIsDefined(
        chunkSize,
        'AI_FINDINGS_ASSOCIATION_CHUNK_SIZE is not defined'
      );
      return z.coerce
        .number()
        .min(1, 'Chunk size must be at least 1')
        .parse(chunkSize);
    },
  });
