import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

import { tokenLogger } from '@backend/infrastructure';
import { type Pillar, type ScanFinding } from '@backend/models';
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
      bestPractice: z.string(),
    }),
  ),
);

export const tokenMapScanFindingsToBestPracticesMappingsDir =
  createInjectionToken<string>('MapScanFindingsToBestPracticesMappingsDir', {
    useValue: join(__dirname, 'mappings'),
  });

export class MapScanFindingsToBestPracticesUseCaseImpl
  implements MapScanFindingsToBestPracticesUseCase
{
  private readonly logger = inject(tokenLogger);
  private readonly mappingsDir = inject(
    tokenMapScanFindingsToBestPracticesMappingsDir,
  );
  static readonly mappingKey = 'scan-findings-to-best-practices-mapping.json';

  private getMapping(): z.infer<typeof MappingSchema> {
    try {
      const rawMapping = readFileSync(
        join(
          this.mappingsDir,
          MapScanFindingsToBestPracticesUseCaseImpl.mappingKey,
        ),
        'utf-8',
      );
      return MappingSchema.parse(parseJsonObject(rawMapping));
    } catch (error) {
      this.logger.info('No mapping found, continuing with an empty one', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {};
    }
  }

  public async mapScanFindingsToBestPractices(args: {
    scanFindings: ScanFinding[];
    pillars: Pillar[];
  }): Promise<ScanFindingsBestPracticesMapping> {
    const { scanFindings, pillars } = args;

    const mapping = this.getMapping();
    return scanFindings.map((finding) => {
      const eventCode = finding?.eventCode;
      const eventCodeBestPractices =
        eventCode && mapping[eventCode] ? mapping[eventCode] : [];

      return {
        scanFinding: finding,
        bestPractices: eventCodeBestPractices
          .map((mappingEntry) => {
            const pillar = pillars.find(
              (p) => p.primaryId === mappingEntry.pillar,
            );
            const question = pillar?.questions.find(
              (q) => q.primaryId === mappingEntry.question,
            );
            const bestPractice = question?.bestPractices.find(
              (bp) => bp.primaryId === mappingEntry.bestPractice,
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
    },
  );
