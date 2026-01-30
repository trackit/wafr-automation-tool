import {
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { tokenAIService } from '../AIService';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  FindingToBestPracticesAssociationServiceGenAI,
  tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
} from './FindingToBestPracticesAssociationServiceGenAI';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'node:fs';
const mockedReadFileSync = vi.mocked(readFileSync);

describe('FindingToBestPracticesAssociationServiceGenAI', () => {
  describe('replacePromptVariables', () => {
    it('should replace variables in the prompt correctly', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const prompt = 'Hello {{name}}, welcome to {{place}}!';
      const variables = { name: 'Alice', place: 'Wonderland' };
      const result =
        findingToBestPracticesAssociationServiceGenAI.replacePromptVariables({
          prompt,
          variables,
        });
      expect(result).toBe('Hello Alice, welcome to Wonderland!');
    });

    it('should not replace variables if none are provided', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const prompt = 'Hello, welcome!';
      const result =
        findingToBestPracticesAssociationServiceGenAI.replacePromptVariables({
          prompt,
          variables: {},
        });
      expect(result).toBe(prompt);
    });

    it('should replace multiple occurrences of the same variable', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const prompt = 'Hello {{name}}, {{name}} is here!';
      const variables = { name: 'Alice' };
      const result =
        findingToBestPracticesAssociationServiceGenAI.replacePromptVariables({
          prompt,
          variables,
        });
      expect(result).toBe('Hello Alice, Alice is here!');
    });

    it('should handle objects variables', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const prompt = 'Hello {{obj}}!';
      const variables = { obj: { name: 'Alice', location: 'Wonderland' } };
      const result =
        findingToBestPracticesAssociationServiceGenAI.replacePromptVariables({
          prompt,
          variables,
        });
      expect(result).toBe('Hello {"name":"Alice","location":"Wonderland"}!');
    });

    it('should handle arrays variables', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const prompt = 'Hello {{arr}}!';
      const variables = { arr: ['Alice', 'Bob'] };
      const result =
        findingToBestPracticesAssociationServiceGenAI.replacePromptVariables({
          prompt,
          variables,
        });
      expect(result).toBe('Hello ["Alice","Bob"]!');
    });
  });

  describe('flattenBestPracticesWithPillarAndQuestionFromPillars', () => {
    it('should flatten best practices with their associated pillar and question', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .build(),
                BestPracticeMother.basic()
                  .withId('bp2')
                  .withLabel('Best Practice 2')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.flattenBestPracticesWithPillarAndQuestionFromPillars(
          pillars,
        );

      expect(result).toEqual([
        expect.objectContaining({
          id: 'bp1',
          label: 'Best Practice 1',
          pillar: pillars[0],
          question: pillars[0].questions[0],
        }),
        expect.objectContaining({
          id: 'bp2',
          label: 'Best Practice 2',
          pillar: pillars[0],
          question: pillars[0].questions[0],
        }),
      ]);
    });
  });

  describe('formatQuestionSet', () => {
    it('should format the question set sent to the ai correctly', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withLabel('Pillar 1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withLabel('Question 1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
                BestPracticeMother.basic()
                  .withId('bp2')
                  .withLabel('Best Practice 2')
                  .withDescription('best practice description 2')
                  .build(),
              ])
              .build(),
            QuestionMother.basic()
              .withId('question-2')
              .withLabel('Question 2')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp3')
                  .withLabel('Best Practice 3')
                  .withDescription('best practice description 3')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatQuestionSet(
          pillars,
        );

      expect(result).toEqual([
        {
          id: 'pillar-1#question-1#bp1',
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 1',
          bestPracticeLabel: 'Best Practice 1',
          bestPracticeDescription: 'best practice description 1',
        },
        {
          id: 'pillar-1#question-1#bp2',
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 1',
          bestPracticeLabel: 'Best Practice 2',
          bestPracticeDescription: 'best practice description 2',
        },
        {
          id: 'pillar-1#question-2#bp3',
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 2',
          bestPracticeLabel: 'Best Practice 3',
          bestPracticeDescription: 'best practice description 3',
        },
      ]);
    });
  });

  describe('formatScanningToolFindings', () => {
    it('should format findings sent to the AI correctly', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
        FindingMother.basic()
          .withId('prowler#2')
          .withRiskDetails('risk details 2')
          .withStatusDetail('status detail 2')
          .build(),
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatScanningToolFindings(
          findings,
        );

      expect(result).toEqual([
        {
          id: 'prowler#1',
          riskDetails: 'risk details 1',
          statusDetail: 'status detail 1',
        },
        {
          id: 'prowler#2',
          riskDetails: 'risk details 2',
          statusDetail: 'status detail 2',
        },
      ]);
    });

    it('should throw an error for invalid finding id format', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const findings = [
        FindingMother.basic().withId('invalid-id-format').build(),
      ];

      expect(() =>
        findingToBestPracticesAssociationServiceGenAI.formatScanningToolFindings(
          findings,
        ),
      ).toThrowError();
    });

    it('should handle findings with missing riskDetails and statusDetail', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const findings = [
        FindingMother.basic()
          .withId('prowler#3')
          .withRiskDetails(undefined)
          .withStatusDetail(undefined)
          .build(),
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatScanningToolFindings(
          findings,
        );

      expect(result).toEqual([
        {
          id: 'prowler#3',
          riskDetails: 'Unknown',
          statusDetail: 'Unknown',
        },
      ]);
    });
  });

  describe('formatAIAssociations', () => {
    it('should separate successful and failed associations', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
        FindingMother.basic()
          .withId('prowler#2')
          .withRiskDetails('risk details 2')
          .withStatusDetail('status detail 2')
          .build(),
      ];
      const findingIdToBestPracticeIdAssociations = [
        {
          findingId: 'prowler#1',
          bestPracticeId: 'pillar-1#question-1#bp1',
        },
        {
          findingId: 'prowler#2',
          bestPracticeId: 'pillar-1#question-1#nonexistent-bp', // This should fail
        },
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatAIAssociations({
          findingIdToBestPracticeIdAssociations,
          findings,
          pillars,
        });

      expect(result.successful).toHaveLength(1);
      expect(result.successful[0]).toEqual({
        finding: findings[0],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'bp1',
          },
        ],
      });
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual(findings[1]);
    });

    it('should return all successful when no failures occur', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [FindingMother.basic().withId('prowler#1').build()];
      const findingIdToBestPracticeIdAssociations = [
        {
          findingId: 'prowler#1',
          bestPracticeId: 'pillar-1#question-1#bp1',
        },
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatAIAssociations({
          findingIdToBestPracticeIdAssociations,
          findings,
          pillars,
        });

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    it('should return all failed when all associations fail', () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic().withId('prowler#1').build(),
        FindingMother.basic().withId('prowler#2').build(),
      ];
      const findingIdToBestPracticeIdAssociations = [
        {
          findingId: 'prowler#1',
          bestPracticeId: 'pillar-1#question-1#nonexistent-bp1',
        },
        {
          findingId: 'prowler#2',
          bestPracticeId: 'pillar-1#question-1#nonexistent-bp2',
        },
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatAIAssociations({
          findingIdToBestPracticeIdAssociations,
          findings,
          pillars,
        });

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
      expect(result.failed).toEqual(findings);
    });
  });

  describe('associateFindingsToBestPractices', () => {
    it('should associate findings to best practices', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.\n';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
                BestPracticeMother.basic()
                  .withId('bp2')
                  .withLabel('Best Practice 2')
                  .withDescription('best practice description 2')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
        FindingMother.basic()
          .withId('prowler#2')
          .withRiskDetails('risk details 2')
          .withStatusDetail('status detail 2')
          .build(),
      ];
      vi.spyOn(aiService, 'converse').mockResolvedValue(
        JSON.stringify([
          {
            findingId: 'prowler#1',
            bestPracticeId: 'pillar-1#question-1#bp1',
          },
          {
            findingId: 'prowler#2',
            bestPracticeId: 'pillar-1#question-1#bp2',
          },
        ]).slice(1), // Skip first bracket because of prefill
      );
      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        );
      expect(result).toEqual([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp1',
            },
          ],
        },
        {
          finding: findings[1],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp2',
            },
          ],
        },
      ]);
    });

    it('should retry on invalid JSON AI response', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
      ];
      vi.spyOn(aiService, 'converse')
        .mockResolvedValueOnce('Invalid json format')
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              findingId: 'prowler#1',
              bestPracticeId: 'pillar-1#question-1#bp1',
            },
          ]).slice(1), // Skip first bracket because of prefill
        );

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        );
      expect(aiService.converse).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp1',
            },
          ],
        },
      ]);
    });

    it('should retry on invalid AI response format', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
      ];
      vi.spyOn(aiService, 'converse')
        .mockResolvedValueOnce(
          JSON.stringify([{ invalid: 0, format: 1 }]).slice(1), // Skip first bracket because of prefill
        )
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              findingId: 'prowler#1',
              bestPracticeId: 'pillar-1#question-1#bp1',
            },
          ]).slice(1), // Skip first bracket because of prefill
        );

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        );
      expect(aiService.converse).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp1',
            },
          ],
        },
      ]);
    });

    it('should return an empty array if no prompt is found', async () => {
      const { findingToBestPracticesAssociationServiceGenAI } = setup();
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings: [],
            pillars: [],
          },
        );
      expect(result).toEqual([]);
    });

    it('should retry only failed findings and preserve successful ones', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.\n';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
                BestPracticeMother.basic()
                  .withId('bp2')
                  .withLabel('Best Practice 2')
                  .withDescription('best practice description 2')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic()
          .withId('prowler#1')
          .withRiskDetails('risk details 1')
          .withStatusDetail('status detail 1')
          .build(),
        FindingMother.basic()
          .withId('prowler#2')
          .withRiskDetails('risk details 2')
          .withStatusDetail('status detail 2')
          .build(),
      ];

      // First call: returns associations with one invalid best practice
      // Second call: returns valid association for the failed finding
      vi.spyOn(aiService, 'converse')
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              findingId: 'prowler#1',
              bestPracticeId: 'pillar-1#question-1#bp1', // valid
            },
            {
              findingId: 'prowler#2',
              bestPracticeId: 'pillar-1#question-1#invalid-bp', // invalid - will cause retry
            },
          ]).slice(1), // Skip first bracket because of prefill
        )
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              findingId: 'prowler#2',
              bestPracticeId: 'pillar-1#question-1#bp2', // valid on retry
            },
          ]).slice(1), // Skip first bracket because of prefill
        );

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        );

      expect(aiService.converse).toHaveBeenCalledTimes(2);

      // Should include both findings in final result
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp1',
            },
          ],
        },
        {
          finding: findings[1],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'bp2',
            },
          ],
        },
      ]);
    });

    it('should return partial results when some findings continue to fail after max retries', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [
        FindingMother.basic().withId('prowler#1').build(),
        FindingMother.basic().withId('prowler#2').build(),
      ];

      // First call succeeds for prowler#1, fails for prowler#2
      // Subsequent calls all fail for prowler#2
      vi.spyOn(aiService, 'converse')
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              findingId: 'prowler#1',
              bestPracticeId: 'pillar-1#question-1#bp1',
            },
            {
              findingId: 'prowler#2',
              bestPracticeId: 'pillar-1#question-1#invalid-bp',
            },
          ]).slice(1), // Skip first bracket because of prefill
        )
        .mockResolvedValue(
          JSON.stringify([
            {
              findingId: 'prowler#2',
              bestPracticeId: 'pillar-1#question-1#invalid-bp',
            },
          ]).slice(1), // Skip first bracket because of prefill
        );

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        );

      // Should return only the successful finding
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        finding: findings[0],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'bp1',
          },
        ],
      });
    });

    it('should throw an error if no findings successfully associated after max retries', async () => {
      const {
        aiService,
        findingToBestPracticesAssociationServiceGenAI,
        maxRetries,
      } = setup();
      mockedReadFileSync.mockImplementation((path) => {
        if (String(path).includes('static-prompt.txt')) {
          return 'This is a prompt.';
        }
        if (String(path).includes('dynamic-prompt.txt')) {
          return 'This is the dynamic part of the prompt.';
        }
        throw new Error(`Unexpected path: ${path}`);
      });
      const pillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('bp1')
                  .withLabel('Best Practice 1')
                  .withDescription('best practice description 1')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const findings = [FindingMother.basic().withId('prowler#1').build()];
      vi.spyOn(aiService, 'converse').mockResolvedValue('Invalid response');

      await expect(
        findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          },
        ),
      ).rejects.toThrowError();
      expect(aiService.converse).toHaveBeenCalledTimes(maxRetries);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  register(tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries, {
    useValue: 3,
  });
  mockedReadFileSync.mockReset();
  const findingToBestPracticesAssociationServiceGenAI =
    new FindingToBestPracticesAssociationServiceGenAI();
  return {
    aiService: inject(tokenAIService),
    maxRetries: inject(
      tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
    ),
    findingToBestPracticesAssociationServiceGenAI,
  };
};
