import { z, ZodType } from 'zod';
import {
  FindingToBestPracticesAssociationService,
  FindingToBestPracticesAssociation,
} from '@backend/ports';
import { inject, createInjectionToken } from '@shared/di-container';
import { tokenAIService } from '../AIService';
import type {
  BestPractice,
  Finding,
  Pillar,
  Question,
  ScanningTool,
} from '@backend/models';
import { assertIsDefined, JSONParseError, parseJsonArray } from '@shared/utils';
import { tokenLogger } from '../Logger';

interface BestPracticeIdToFindingIdsAssociation {
  id: number;
  start: number;
  end: number;
}

// This schema defines the structure of the classification results
// id is the best practice index
// start and end are the ids range boundaries of the findings that match this best practice.
const BestPracticeIdToFindingIdsAssociationsSchema = z.array(
  z.object({
    id: z.number(),
    start: z.number(),
    end: z.number(),
  })
) satisfies ZodType<BestPracticeIdToFindingIdsAssociation[]>;

type BestPracticeIdToFindingIdsAssociations = z.infer<
  typeof BestPracticeIdToFindingIdsAssociationsSchema
>;

export class FindingToBestPracticesAssociationServiceGenAI
  implements FindingToBestPracticesAssociationService
{
  private readonly aiService = inject(tokenAIService);
  private readonly promptArn = inject(tokenPromptArn);
  private readonly logger = inject(tokenLogger);
  private readonly maxRetries = inject(
    tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries
  );

  public flattenBestPracticesWithPillarAndQuestionFromPillars(
    pillars: Pillar[]
  ): (BestPractice & { pillar: Pillar; question: Question })[] {
    return pillars.flatMap((pillar) =>
      pillar.questions.flatMap((question) =>
        question.bestPractices.map((bestPractice) => ({
          ...bestPractice,
          pillar,
          question,
        }))
      )
    );
  }

  public formatQuestionSet(pillars: Pillar[]): {
    id: number;
    pillarLabel: string;
    questionLabel: string;
    bestPracticeLabel: string;
    bestPracticeDescription: string;
  }[] {
    const flattenedBestPractices =
      this.flattenBestPracticesWithPillarAndQuestionFromPillars(pillars);
    return flattenedBestPractices.map(
      ({ pillar, question, ...bestPractice }, index) => ({
        id: index,
        pillarLabel: pillar.label,
        questionLabel: question.label,
        bestPracticeLabel: bestPractice.label,
        bestPracticeDescription: bestPractice.description,
      })
    );
  }

  public formatScanningToolFindings(findings: Finding[]): {
    id: number;
    riskDetails: string | 'Unknown';
    statusDetail: string | 'Unknown';
  }[] {
    return findings.map((finding) => {
      // Finding id is expected to be in the format "tool#12345"
      const findingNumericId = Number(finding.id.split('#')?.[1]);
      if (isNaN(findingNumericId)) {
        throw new Error(`Invalid finding id format ${finding.id}`);
      }
      return {
        id: findingNumericId,
        riskDetails: finding.riskDetails ?? 'Unknown',
        statusDetail: finding.statusDetail ?? 'Unknown',
      };
    });
  }

  public formatAIAssociations(args: {
    bestPracticeIdToFindingIdsAssociations: BestPracticeIdToFindingIdsAssociations;
    findings: Finding[];
    pillars: Pillar[];
  }): FindingToBestPracticesAssociation[] {
    const { bestPracticeIdToFindingIdsAssociations, findings, pillars } = args;
    const flattenedBestPractices =
      this.flattenBestPracticesWithPillarAndQuestionFromPillars(pillars);
    // for (const classification of bestPracticeIdToFindingIdsAssociations) {
    //   const bestPractice = bestPractices[classification.id];
    //   if (!bestPractice) {
    //     continue; // TODO: Throw an error and retry converse
    //   }
    //   const bestPracticeFindings =
    //     this.getBestPracticeFindingsFromClassification({
    //       classification,
    //       findings,
    //       scanningTool,
    //     });
    //   for (const finding of bestPracticeFindings) {
    //     if (!findingIdToFindingToBestPracticesAssociation[finding.id]) {
    //       findingIdToFindingToBestPracticesAssociation[finding.id] = {
    //         finding,
    //         bestPractices: [],
    //       };
    //     }
    //     findingIdToFindingToBestPracticesAssociation[
    //       finding.id
    //     ].bestPractices.push({
    //       pillarId: bestPractice.pillar.id,
    //       questionId: bestPractice.question.id,
    //       bestPracticeId: bestPractice.id,
    //     });
    //   }
    // }
    return findings.map((finding) => {
      const findingNumericId = Number(finding.id.split('#')?.[1]);
      if (isNaN(findingNumericId)) {
        throw new Error(`Invalid finding id format ${finding.id}`);
      }
      const findingBestPracticeIndexes = bestPracticeIdToFindingIdsAssociations
        .filter(
          (classification) =>
            findingNumericId >= classification.start &&
            findingNumericId <= classification.end
        )
        .map((classification) => classification.id);
      const findingBestPractices = findingBestPracticeIndexes
        .map((bestPracticeIdx) => {
          const bestPractice = flattenedBestPractices[bestPracticeIdx];
          if (!bestPractice) {
            return null; // TODO: Throw an error and retry converse
          }
          return {
            pillarId: bestPractice.pillar.id,
            questionId: bestPractice.question.id,
            bestPracticeId: bestPractice.id,
          };
        })
        .filter((bp): bp is NonNullable<typeof bp> => bp !== null);
      return {
        finding,
        bestPractices: findingBestPractices,
      };
    });
  }

  public async associateFindingsToBestPractices(args: {
    scanningTool: ScanningTool;
    findings: Finding[];
    pillars: Pillar[];
  }): Promise<FindingToBestPracticesAssociation[]> {
    const { scanningTool, findings, pillars } = args;
    let maxRetries = this.maxRetries;
    this.logger.info(
      `Associating findings to best practices for scanning tool: ${scanningTool}`,
      { findings }
    );
    do {
      const stringifiedAIResponse = await this.aiService.converse({
        promptArn: this.promptArn,
        promptVariables: {
          scanningToolTitle: scanningTool,
          questionSet: this.formatQuestionSet(pillars),
          scanningToolFindings: this.formatScanningToolFindings(findings),
        },
      });
      try {
        const aiResponse = parseJsonArray(stringifiedAIResponse);
        const bestPracticeIdToFindingIdsAssociations =
          BestPracticeIdToFindingIdsAssociationsSchema.parse(aiResponse);
        return this.formatAIAssociations({
          bestPracticeIdToFindingIdsAssociations,
          findings,
          pillars,
        });
      } catch (error) {
        if (error instanceof JSONParseError) {
          this.logger.error(`Failed to parse AI response: ${error.message}.`);
        }
        if (error instanceof z.ZodError) {
          this.logger.error(`AI response validation failed: ${error.message}.`);
        }
        continue; // Retry with a new AI call
      }
    } while (maxRetries-- > 0);
    throw new Error(
      `Failed to associate findings to best practices after ${maxRetries} retries`
    );
  }
}

export const tokenFindingToBestPracticesAssociationService =
  createInjectionToken<FindingToBestPracticesAssociationService>(
    'FindingToBestPracticesAssociationService',
    {
      useClass: FindingToBestPracticesAssociationServiceGenAI,
    }
  );

export const tokenPromptArn = createInjectionToken<string>('PromptArn', {
  useFactory: () => {
    const promptArn = process.env.PROMPT_ARN;
    assertIsDefined(promptArn, 'PROMPT_ARN is not defined');
    return promptArn;
  },
});

export const tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries =
  createInjectionToken<number>(
    'FindingToBestPracticesAssociationServiceGenAIMaxRetries',
    {
      useValue: 3,
    }
  );
