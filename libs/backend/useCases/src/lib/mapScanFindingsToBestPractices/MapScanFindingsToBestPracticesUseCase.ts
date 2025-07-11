import { z } from 'zod';

import { tokenLogger, tokenObjectsStorage } from '@backend/infrastructure';
import { Pillar, ScanFinding } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

export type ScanFindingsBestPracticesMapping = {
  scanFinding: ScanFinding;
  bestPractices: {
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }[];
}[];

export interface MapScanFindingsToBestPracticesUseCase {
  mapScanFindingsToBestPractices(args: {
    scanFindings: ScanFinding[];
    pillars: Pillar[];
  }): Promise<ScanFindingsBestPracticesMapping>;
}

const MappingSchema = z.record(
  z.string(),
  z.array(
    z.object({
      pillar: z.string(),
      question: z.string(),
      best_practice: z.string(),
    })
  )
);

export class MapScanFindingsToBestPracticesUseCaseImpl
  implements MapScanFindingsToBestPracticesUseCase
{
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly logger = inject(tokenLogger);
  static readonly mappingKey = 'scan-findings-to-best-practices-mapping.json';

  private async getMapping(): Promise<z.infer<typeof MappingSchema>> {
    const rawMapping = await this.objectsStorage.get(
      MapScanFindingsToBestPracticesUseCaseImpl.mappingKey
    );
    if (!rawMapping) {
      this.logger.info('No mapping found, continuing with an empty one');
      return {};
    }
    return MappingSchema.parse(parseJsonObject(rawMapping));
  }

  public async mapScanFindingsToBestPractices(args: {
    scanFindings: ScanFinding[];
    pillars: Pillar[];
  }): Promise<ScanFindingsBestPracticesMapping> {
    const { scanFindings, pillars } = args;

    const mapping = await this.getMapping();
    return scanFindings.map((finding) => {
      const eventCode = finding.metadata?.eventCode;
      const eventCodeBestPractices =
        eventCode && mapping[eventCode] ? mapping[eventCode] : [];

      return {
        scanFinding: finding,
        bestPractices: eventCodeBestPractices
          .map((mappingEntry) => {
            const pillar = pillars.find(
              (p) => p.primaryId === mappingEntry.pillar
            );
            const question = pillar?.questions.find(
              (q) => q.primaryId === mappingEntry.question
            );
            const bestPractice = question?.bestPractices.find(
              (bp) => bp.primaryId === mappingEntry.best_practice
            );
            if (!pillar || !question || !bestPractice) {
              return null;
            }
            return {
              pillarId: pillar.id,
              questionId: question.id,
              bestPracticeId: bestPractice.id,
            };
          })
          .filter((m): m is NonNullable<typeof m> => Boolean(m)),
      };
    });
  }
}

export const tokenMapScanFindingsToBestPracticesUseCase =
  createInjectionToken<MapScanFindingsToBestPracticesUseCase>(
    'MapScanFindingsToBestPracticesUseCase',
    {
      useClass: MapScanFindingsToBestPracticesUseCaseImpl,
    }
  );
