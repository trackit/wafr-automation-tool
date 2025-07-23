import { InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime';
import {
  RetryErrorType,
  tokenDynamoDBAssessmentTableName,
  tokenFakeLogger,
  tokenFindingToBestPracticesAssociationService,
  tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
  tokenLogger,
  tokenQuestionSetService,
  tokenS3Bucket,
} from '@backend/infrastructure';
import { Finding, QuestionSet, ScanningTool } from '@backend/models';
import { FindingToBestPracticesAssociation } from '@backend/ports';
import {
  ScanFindingsBestPracticesMapping,
  tokenMapScanFindingsToBestPracticesUseCase,
} from '@backend/useCases';
import { inject, register, reset } from '@shared/di-container';
import { chunk, parseJsonArray, parseJsonObject } from '@shared/utils';
import fs from 'fs';
import path from 'path';

interface TestCase {
  perProcess: number;
  limit: number;
  aiParameters: InferenceConfiguration;
}

interface TestCaseProcessResult {
  success: number;
  failed: FailData[];
  retries: {
    errorType: RetryErrorType;
    message: string;
  }[];
  promptLengths: number;
}

interface FailData {
  message: string;
  data: {
    aiFinding: FindingToBestPracticesAssociation;
    correctFinding: ScanFindingsBestPracticesMapping[number];
  };
}

export class AIServiceBedrockTestScript {
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly findingToBestPracticesAssociationService = inject(
    tokenFindingToBestPracticesAssociationService
  );
  private readonly mapFindingsToBestPracticesUseCase = inject(
    tokenMapScanFindingsToBestPracticesUseCase
  );

  private getTestConfigs(): TestCase[] {
    return parseJsonArray(
      fs.readFileSync(path.join(__dirname, 'testConfig.json'), 'utf8')
    ) as unknown as TestCase[];
  }

  private getTestFindings(): Record<string, Finding[]> {
    return parseJsonObject(
      fs.readFileSync(path.join(__dirname, 'testFindings.json'), 'utf8')
    ) as unknown as Record<string, Finding[]>;
  }

  private async runTestCaseProcess(
    questionSet: QuestionSet,
    testCase: TestCase,
    findings: Finding[]
  ): Promise<TestCaseProcessResult> {
    const fakeLogger = inject(tokenFakeLogger);
    const findingsAssociatedByMapping =
      await this.mapFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices(
        {
          scanFindings: findings,
          pillars: questionSet.pillars,
        }
      );
    const findingsAssociatedByAI =
      await this.findingToBestPracticesAssociationService.associateFindingsToBestPractices(
        {
          scanningTool: ScanningTool.PROWLER,
          findings,
          pillars: questionSet.pillars,
          inferenceConfig: testCase.aiParameters,
        }
      );

    const promptLengths = fakeLogger.logs
      .filter((log) => log.level === 'info')
      .map((log) => {
        console.log(log.data);
        if (log.data && typeof log.data === 'object' && 'prompt' in log.data) {
          return (log.data.prompt as string).length as number;
        }
        return 0;
      });
    const promptLengthsSum = promptLengths.reduce(
      (total, current) => total + current,
      0
    );
    const retries = fakeLogger.logs
      .filter((log) => log.level === 'error')
      .map((log) => {
        return {
          errorType: log.data as RetryErrorType,
          message: log.message,
        };
      });

    let success = 0;
    const failed: FailData[] = [];

    findingsAssociatedByAI.forEach((findingAI) => {
      const findingMapping = findingsAssociatedByMapping.find(
        (findingMapping) =>
          findingMapping.scanFinding.id === findingAI.finding.id
      );
      if (!findingMapping) {
        throw new Error(`Finding ${findingAI.finding.id} not found in mapping`);
      }
      if (findingAI.bestPractices.length === 0) {
        failed.push({
          message: `No best practices found for finding ${findingAI.finding.id}`,
          data: {
            aiFinding: findingAI,
            correctFinding: findingMapping,
          },
        });
        return;
      }
      findingAI.bestPractices.forEach((bestPractice) => {
        const bestPracticeMapping = findingMapping.bestPractices.find(
          (bestPracticeMapping) =>
            bestPracticeMapping.pillarId === bestPractice.pillarId &&
            bestPracticeMapping.questionId === bestPractice.questionId &&
            bestPracticeMapping.bestPracticeId === bestPractice.bestPracticeId
        );
        if (bestPracticeMapping) {
          success++;
        } else {
          failed.push({
            message: `Best practice ${bestPractice.bestPracticeId} not found in mapping for finding ${findingAI.finding.id}`,
            data: {
              aiFinding: findingAI,
              correctFinding: findingMapping,
            },
          });
        }
      });
    });
    return { success, failed, retries, promptLengths: promptLengthsSum };
  }

  private async runTestCase(
    questionSet: QuestionSet,
    testCase: TestCase,
    testFindings: Record<string, Finding[]>
  ): Promise<TestCaseProcessResult | undefined> {
    const findings = Object.values(testFindings).flatMap((fList) =>
      fList.slice(0, testCase.limit)
    );
    const perProcessFindings = chunk(findings, testCase.perProcess);
    const testCaseProcessResults: TestCaseProcessResult[] = await Promise.all(
      perProcessFindings.map(async (findingsChunk) => {
        return await this.runTestCaseProcess(
          questionSet,
          testCase,
          findingsChunk
        );
      })
    );
    return Object.values(testCaseProcessResults).reduce(
      (total, current) => ({
        success: total.success + current.success,
        failed: [...total.failed, ...current.failed],
        retries: [...total.retries, ...current.retries],
        promptLengths: total.promptLengths + current.promptLengths,
      }),
      { success: 0, failed: [], retries: [], promptLengths: 0 }
    );
  }

  private generateReport(
    testCaseProcessResults: Record<number, TestCaseProcessResult>
  ): void {
    console.log('\n=== AIServiceBedrockTestScript Report ===');
    console.table(
      Object.values(testCaseProcessResults).map(
        ({ success, failed, retries }) => {
          const total = success + failed.length;
          const successRate =
            total > 0 ? `${((success / total) * 100).toFixed(2)}%` : 'N/A';
          return {
            'Test Case #': failed.length > 0 ? ' FAILED' : ' PASSED',
            Success: success,
            Failed: failed.map(({ message, data }) => {
              return `${message}
              ${JSON.stringify(data)}`;
            }),
            Retries: retries,
            'Success Rate': successRate,
          };
        }
      )
    );

    // TODO: Rajouter le nombre de characters pour le testcase
    // TODO:

    const report = Object.values(testCaseProcessResults).map(
      ({ success, failed, retries, promptLengths }) => {
        const total = success + failed.length;
        const successRate =
          total > 0 ? `${((success / total) * 100).toFixed(2)}%` : 'N/A';
        return {
          total,
          success,
          failed,
          retries,
          successRate,
          promptLengths,
        };
      }
    );

    fs.writeFileSync(
      path.join(__dirname, `report-${new Date().toISOString()}.json`),
      JSON.stringify(report, null, 2)
    );
  }

  public async run(): Promise<void> {
    const questionSet = this.questionSetService.get();
    const testConfigs = this.getTestConfigs();
    const testFindings = this.getTestFindings();

    const testCaseProcessResults = Object.fromEntries(
      await Promise.all(
        Array.from(testConfigs).map(async (testCase, index) => [
          index,
          await this.runTestCase(questionSet, testCase, testFindings),
        ])
      )
    ) as Record<number, TestCaseProcessResult>;
    this.generateReport(testCaseProcessResults);
  }
}

describe('AIServiceBedrockTestScript', () => {
  it('should run successfully', async () => {
    reset();
    register(tokenLogger, { useFactory: () => inject(tokenFakeLogger) });
    register(tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries, {
      useValue: 3,
    });
    register(tokenS3Bucket, {
      useValue: 'wafr-automation-tool-antoine-576872909007',
    });
    register(tokenDynamoDBAssessmentTableName, { useValue: 'test-ddb-table' });
    const aiServiceBedrockTestScript = new AIServiceBedrockTestScript();
    await aiServiceBedrockTestScript.run();
  });
});
