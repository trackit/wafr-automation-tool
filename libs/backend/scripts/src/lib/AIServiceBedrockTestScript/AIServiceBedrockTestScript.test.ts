import fs from 'fs';
import path from 'path';

import {
  tokenFakeLogger,
  tokenFindingToBestPracticesAssociationService,
  tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
  tokenFindingToBestPracticesAssociationServiceGenAIPromptsDir,
  tokenLogger,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import { type Finding, type QuestionSet, ScanningTool } from '@backend/models';
import {
  type AIInferenceConfig,
  type FindingToBestPracticesAssociation,
} from '@backend/ports';
import {
  type ScanFindingsBestPracticesMapping,
  tokenMapScanFindingsToBestPracticesMappingsDir,
  tokenMapScanFindingsToBestPracticesUseCase,
} from '@backend/useCases';
import { inject, register, reset } from '@shared/di-container';
import { chunk, parseJsonObject } from '@shared/utils';

const TEST_CONFIG: TestCase = {
  perProcess: 10,
  limit: 100,
  aiParameters: {},
};

interface TestCase {
  perProcess: number;
  limit: number;
  aiParameters: AIInferenceConfig;
}

interface TestCaseProcessResult {
  success: number;
  failed: FailData[];
  retries: {
    error: unknown;
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

class AIServiceBedrockTestScript {
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly findingToBestPracticesAssociationService = inject(
    tokenFindingToBestPracticesAssociationService,
  );
  private readonly mapFindingsToBestPracticesUseCase = inject(
    tokenMapScanFindingsToBestPracticesUseCase,
  );

  private getTestFindings(): Record<string, Finding[]> {
    return parseJsonObject(
      fs.readFileSync(path.join(__dirname, 'testFindings.json'), 'utf8'),
    ) as unknown as Record<string, Finding[]>;
  }

  private async runTestCaseProcess(
    questionSet: QuestionSet,
    testCase: TestCase,
    findings: Finding[],
  ): Promise<TestCaseProcessResult> {
    const fakeLogger = inject(tokenFakeLogger);
    const findingsAssociatedByMapping =
      await this.mapFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices(
        {
          scanFindings: findings,
          pillars: questionSet.pillars,
        },
      );
    const findingsAssociatedByAI =
      await this.findingToBestPracticesAssociationService.associateFindingsToBestPractices(
        {
          scanningTool: ScanningTool.PROWLER,
          findings,
          pillars: questionSet.pillars,
          inferenceConfig: testCase.aiParameters,
        },
      );

    const promptLengths = fakeLogger.logs
      .filter(
        (log) =>
          log.level === 'info' &&
          log.data &&
          typeof log.data === 'object' &&
          'prompt' in log.data,
      )
      .map((log) => {
        if (log.data && typeof log.data === 'object' && 'prompt' in log.data) {
          return (log.data.prompt as string).length as number;
        }
        throw new Error('Unexpected log format');
      });
    const promptLengthsSum = promptLengths.reduce(
      (total, current) => total + current,
      0,
    );
    const retries = fakeLogger.logs
      .filter((log) => log.level === 'error')
      .map((log) => ({
        error: log.data,
        message: log.message,
      }));
    fakeLogger.logs = [];

    let success = 0;
    const failed: FailData[] = [];

    for (const findingAI of findingsAssociatedByAI) {
      const findingMapping = findingsAssociatedByMapping.find(
        (fm) => fm.scanFinding.id === findingAI.finding.id,
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
        continue;
      }
      for (const bestPractice of findingAI.bestPractices) {
        const bestPracticeMapping = findingMapping.bestPractices.find(
          (bpm) =>
            bpm.pillarId === bestPractice.pillarId &&
            bpm.questionId === bestPractice.questionId &&
            bpm.bestPracticeId === bestPractice.bestPracticeId,
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
      }
    }
    return { success, failed, retries, promptLengths: promptLengthsSum };
  }

  private async runTestCase(
    questionSet: QuestionSet,
    testCase: TestCase,
    testFindings: Record<string, Finding[]>,
  ): Promise<TestCaseProcessResult> {
    const findings = Object.values(testFindings).flatMap((fList) =>
      fList.slice(0, testCase.limit),
    );
    const perProcessFindings = chunk(findings, testCase.perProcess);
    const testCaseProcessResults: TestCaseProcessResult[] = await Promise.all(
      perProcessFindings.map((findingsChunk) =>
        this.runTestCaseProcess(questionSet, testCase, findingsChunk),
      ),
    );
    return testCaseProcessResults.reduce(
      (total, current) => ({
        success: total.success + current.success,
        failed: [...total.failed, ...current.failed],
        retries: [...total.retries, ...current.retries],
        promptLengths: total.promptLengths + current.promptLengths,
      }),
      { success: 0, failed: [], retries: [], promptLengths: 0 },
    );
  }

  private generateReport(result: TestCaseProcessResult): void {
    const total = result.success + result.failed.length;
    const successRate =
      total > 0 ? `${((result.success / total) * 100).toFixed(2)}%` : 'N/A';

    console.log('\n=== AIServiceBedrockTestScript Report ===');
    console.table({
      Status: result.failed.length > 0 ? 'FAILED' : 'PASSED',
      Success: result.success,
      Failed: result.failed.length,
      Retries: result.retries.length,
      'Success Rate': successRate,
      'Prompt Lengths': result.promptLengths,
    });

    if (result.failed.length > 0) {
      console.log('\nFailed findings:');
      result.failed.forEach(({ message }) => console.log(`  - ${message}`));
    }

    const report = {
      total,
      success: result.success,
      failed: result.failed,
      retries: result.retries,
      successRate,
      promptLengths: result.promptLengths,
    };

    fs.writeFileSync(
      path.join(__dirname, `report-${new Date().toISOString()}.json`),
      JSON.stringify(report, null, 2),
    );
  }

  public async run(): Promise<void> {
    const questionSet = this.questionSetService.get();
    const testFindings = this.getTestFindings();
    const result = await this.runTestCase(questionSet, TEST_CONFIG, testFindings);
    this.generateReport(result);
  }
}

describe('AIServiceBedrockTestScript', () => {
  it('should run successfully', async () => {
    reset();
    register(tokenLogger, { useFactory: () => inject(tokenFakeLogger) });
    register(tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries, {
      useValue: 3,
    });
    register(tokenFindingToBestPracticesAssociationServiceGenAIPromptsDir, {
      useValue: path.join(process.cwd(), 'data', 'prompts'),
    });
    register(tokenMapScanFindingsToBestPracticesMappingsDir, {
      useValue: path.join(process.cwd(), 'data', 'mappings'),
    });

    const testScript = new AIServiceBedrockTestScript();
    await testScript.run();
  });
});
