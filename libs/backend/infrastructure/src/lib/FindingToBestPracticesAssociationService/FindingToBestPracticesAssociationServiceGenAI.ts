import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z, type ZodType } from 'zod';

import type {
  BestPractice,
  Finding,
  Pillar,
  Question,
  ScanningTool,
} from '@backend/models';
import {
  type AIInferenceConfig,
  type FindingToBestPracticesAssociation,
  type FindingToBestPracticesAssociationService,
  type Prompt,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined, JSONParseError, parseJsonArray } from '@shared/utils';

import { tokenAIService } from '../AIService';
import { tokenLogger } from '../Logger';

interface FindingIdToBestPracticeIdAssociation {
  findingId: string;
  bestPracticeId: string;
}

const FindingIdToBestPracticeIdAssociationsSchema = z.array(
  z.object({
    findingId: z.string(),
    bestPracticeId: z.string(),
  }),
) satisfies ZodType<FindingIdToBestPracticeIdAssociation[]>;

type FindingIdToBestPracticeIdAssociations = z.infer<
  typeof FindingIdToBestPracticeIdAssociationsSchema
>;

export class FindingToBestPracticesAssociationServiceGenAI
  implements FindingToBestPracticesAssociationService
{
  private readonly aiService = inject(tokenAIService);
  private readonly logger = inject(tokenLogger);
  private readonly maxRetries = inject(
    tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
  );
  private readonly promptsDir = inject(
    tokenFindingToBestPracticesAssociationServiceGenAIPromptsDir,
  );
  static readonly staticPromptKey = 'static-prompt.txt';
  static readonly dynamicPromptKey = 'dynamic-prompt.txt';

  private static cachedPrompt: {
    staticPrompt: string;
    dynamicPrompt: string;
  } | null = null;

  public static clearPromptCache(): void {
    FindingToBestPracticesAssociationServiceGenAI.cachedPrompt = null;
  }

  public fetchPrompt(): {
    staticPrompt: string;
    dynamicPrompt: string;
  } | null {
    if (FindingToBestPracticesAssociationServiceGenAI.cachedPrompt) {
      return FindingToBestPracticesAssociationServiceGenAI.cachedPrompt;
    }

    try {
      const staticPrompt = readFileSync(
        join(
          this.promptsDir,
          FindingToBestPracticesAssociationServiceGenAI.staticPromptKey,
        ),
        'utf-8',
      );
      const dynamicPrompt = readFileSync(
        join(
          this.promptsDir,
          FindingToBestPracticesAssociationServiceGenAI.dynamicPromptKey,
        ),
        'utf-8',
      );
      FindingToBestPracticesAssociationServiceGenAI.cachedPrompt = {
        staticPrompt,
        dynamicPrompt,
      };
      return FindingToBestPracticesAssociationServiceGenAI.cachedPrompt;
    } catch (error) {
      this.logger.warn('Failed to read prompt files from filesystem', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public formatPrompt(args: {
    staticPrompt: string;
    dynamicPrompt: string;
    pillars: Pillar[];
    findings: Finding[];
  }): Prompt {
    const { staticPrompt, dynamicPrompt, pillars, findings } = args;
    const formattedStaticPrompt = this.replacePromptVariables({
      prompt: staticPrompt,
      variables: {
        bestPractices: this.formatQuestionSet(pillars),
      },
    });
    const formattedDynamicPrompt = this.replacePromptVariables({
      prompt: dynamicPrompt,
      variables: {
        findings: this.formatScanningToolFindings(findings),
      },
    });
    return [
      { text: formattedStaticPrompt },
      { cachePoint: true },
      { text: formattedDynamicPrompt },
    ];
  }

  public replacePromptVariables(args: {
    prompt: string;
    variables: Record<string, unknown>;
  }): string {
    const { prompt, variables } = args;
    return Object.entries(variables).reduce(
      (updatedPrompt, [key, value]) =>
        updatedPrompt.replace(
          new RegExp(`{{${key}}}`, 'g'),
          typeof value === 'string' ? value : JSON.stringify(value),
        ),
      prompt,
    );
  }

  public flattenBestPracticesWithPillarAndQuestionFromPillars(
    pillars: Pillar[],
  ): (BestPractice & { pillar: Pillar; question: Question })[] {
    return pillars.flatMap((pillar) =>
      pillar.questions.flatMap((question) =>
        question.bestPractices.map((bestPractice) => ({
          ...bestPractice,
          pillar,
          question,
        })),
      ),
    );
  }

  public formatQuestionSet(pillars: Pillar[]): {
    id: string;
    pillarLabel: string;
    questionLabel: string;
    bestPracticeLabel: string;
    bestPracticeDescription: string;
  }[] {
    const flattenedBestPractices =
      this.flattenBestPracticesWithPillarAndQuestionFromPillars(pillars);
    return flattenedBestPractices.map(
      ({ pillar, question, ...bestPractice }) => ({
        id: `${pillar.id}#${question.id}#${bestPractice.id}`,
        pillarLabel: pillar.label,
        questionLabel: question.label,
        bestPracticeLabel: bestPractice.label,
        bestPracticeDescription: bestPractice.description,
      }),
    );
  }

  public formatScanningToolFindings(findings: Finding[]): {
    id: string;
    riskDetails: string | 'Unknown';
    statusDetail: string | 'Unknown';
  }[] {
    return findings.map((finding) => {
      if (!/^[a-zA-Z]+#[0-9]+$/.test(finding.id)) {
        throw new Error(`Invalid finding id format: ${finding.id}`);
      }
      return {
        id: finding.id,
        riskDetails: finding.riskDetails ?? 'Unknown',
        statusDetail: finding.statusDetail ?? 'Unknown',
      };
    });
  }

  public formatAIAssociations(args: {
    findingIdToBestPracticeIdAssociations: FindingIdToBestPracticeIdAssociations;
    findings: Finding[];
    pillars: Pillar[];
  }): {
    successful: FindingToBestPracticesAssociation[];
    failed: Finding[];
  } {
    const { findingIdToBestPracticeIdAssociations, findings, pillars } = args;
    const flattenedBestPractices =
      this.flattenBestPracticesWithPillarAndQuestionFromPillars(pillars);
    const successful: FindingToBestPracticesAssociation[] = [];
    const failed: Finding[] = [];

    for (const finding of findings) {
      try {
        const findingBestPractices = findingIdToBestPracticeIdAssociations
          .filter((association) => association.findingId === finding.id)
          .map((association) => {
            const [pillarId, questionId, bestPracticeId] =
              association.bestPracticeId.split('#');
            const existingBestPractice = flattenedBestPractices.find(
              (bp) =>
                bp.id === bestPracticeId &&
                bp.pillar.id === pillarId &&
                bp.question.id === questionId,
            );
            if (!existingBestPractice) {
              throw new Error(
                `Best practice not found for association: ${association.findingId}-${association.bestPracticeId}`,
              );
            }
            return {
              pillarId,
              questionId,
              bestPracticeId,
            };
          });
        successful.push({
          finding,
          bestPractices: findingBestPractices,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to process finding ${finding.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        failed.push(finding);
      }
    }

    return { successful, failed };
  }

  public async associateFindingsToBestPractices(args: {
    scanningTool: ScanningTool;
    findings: Finding[];
    pillars: Pillar[];
    inferenceConfig?: AIInferenceConfig;
  }): Promise<FindingToBestPracticesAssociation[]> {
    const { scanningTool, findings, pillars, inferenceConfig } = args;
    const prompt = this.fetchPrompt();


    if (!prompt) {
      this.logger.warn('Prompt not found, not associating findings.');
      return [];
    }
    this.logger.info(
      `Associating findings to best practices for scanning tool: ${scanningTool}`,
      { findings },
    );

    const successfulAssociations: FindingToBestPracticesAssociation[] = [];
    let remainingFindings = [...findings];
    for (
      let maxRetries = this.maxRetries;
      remainingFindings.length > 0 && maxRetries > 0;
      maxRetries--
    ) {
      try {
        const stringifiedAIResponse = await this.aiService.converse({
          prompt: this.formatPrompt({
            staticPrompt: prompt.staticPrompt,
            dynamicPrompt: prompt.dynamicPrompt,
            pillars,
            findings: remainingFindings,
          }),
          prefill: { text: '[' },
          inferenceConfig,
        });

        this.logger.debug('stringifiedAIResponse', {
          stringifiedAIResponse,
          builtArray: '[' + stringifiedAIResponse.trim(),
        });

        const aiResponse = parseJsonArray('[' + stringifiedAIResponse.trim());
        const findingIdToBestPracticeIdAssociations =
          FindingIdToBestPracticeIdAssociationsSchema.parse(aiResponse);

        const { successful, failed } = this.formatAIAssociations({
          findingIdToBestPracticeIdAssociations,
          findings: remainingFindings,
          pillars,
        });

        successfulAssociations.push(...successful);
        remainingFindings = failed;

        if (failed.length === 0) {
          break;
        } else {
          this.logger.info(
            `Successfully processed ${successful.length} findings, ${failed.length} remaining. Retrying failed findings.`,
            {
              successfulIds: successful.map((a) => a.finding.id),
              failedIds: failed.map((f) => f.id),
            },
          );
        }
      } catch (error) {
        if (error instanceof JSONParseError) {
          this.logger.error(
            `Failed to parse AI response: ${error.message}.`,
            error,
          );
        } else if (error instanceof z.ZodError) {
          this.logger.error(
            `AI response validation failed: ${error.message}.`,
            error,
          );
        } else if (error instanceof Error) {
          this.logger.error(`AI error: ${error.message}`, error);
        }
      }
    }

    if (successfulAssociations.length === 0) {
      throw new Error(
        `Failed to associate all findings to best practices after ${this.maxRetries} retries`,
      );
    } else if (remainingFindings.length > 0) {
      this.logger.warn(
        `Failed to associate ${remainingFindings.length} findings to best practices after ${this.maxRetries} retries`,
        { failedFindingIds: remainingFindings.map((f) => f.id) },
      );
    }

    this.logger.info(
      `Successfully associated ${successfulAssociations.length} out of ${findings.length} findings to best practices`,
    );

    return successfulAssociations;
  }
}

export const tokenFindingToBestPracticesAssociationService =
  createInjectionToken<FindingToBestPracticesAssociationService>(
    'FindingToBestPracticesAssociationService',
    {
      useClass: FindingToBestPracticesAssociationServiceGenAI,
    },
  );

export const tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries =
  createInjectionToken<number>(
    'FindingToBestPracticesAssociationServiceGenAIMaxRetries',
    {
      useFactory: () => {
        const genAIMaxRetries = process.env.GEN_AI_MAX_RETRIES;
        assertIsDefined(genAIMaxRetries, 'GEN_AI_MAX_RETRIES is not defined');
        return z.coerce
          .number()
          .positive('GEN_AI_MAX_RETRIES must be a positive number')
          .parse(genAIMaxRetries);
      },
    },
  );

export const tokenFindingToBestPracticesAssociationServiceGenAIPromptsDir =
  createInjectionToken<string>(
    'FindingToBestPracticesAssociationServiceGenAIPromptsDir',
    {
      useValue: join(__dirname, 'prompts'),
    },
  );
