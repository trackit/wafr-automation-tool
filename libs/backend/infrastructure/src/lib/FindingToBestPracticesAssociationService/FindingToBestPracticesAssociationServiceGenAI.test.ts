import { inject, register, reset } from '@shared/di-container';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  FindingToBestPracticesAssociationServiceGenAI,
  tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries,
} from './FindingToBestPracticesAssociationServiceGenAI';
import { tokenAIService } from '../AIService';
import {
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
} from '@backend/models';

describe('FindingToBestPracticesAssociationServiceGenAI', () => {
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
          pillars
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
          pillars
        );

      expect(result).toEqual([
        {
          id: 0,
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 1',
          bestPracticeLabel: 'Best Practice 1',
          bestPracticeDescription: 'best practice description 1',
        },
        {
          id: 1,
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 1',
          bestPracticeLabel: 'Best Practice 2',
          bestPracticeDescription: 'best practice description 2',
        },
        {
          id: 2,
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
          findings
        );

      expect(result).toEqual([
        {
          id: 1,
          riskDetails: 'risk details 1',
          statusDetail: 'status detail 1',
        },
        {
          id: 2,
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
          findings
        )
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
          findings
        );

      expect(result).toEqual([
        {
          id: 3,
          riskDetails: 'Unknown',
          statusDetail: 'Unknown',
        },
      ]);
    });
  });

  describe('formatAIAssociations', () => {
    it('should format the AI associations correctly', () => {
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
      const bestPracticeIdToFindingIdsAssociations = [
        {
          id: 0,
          start: 1,
          end: 1,
        },
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatAIAssociations({
          bestPracticeIdToFindingIdsAssociations,
          findings,
          pillars,
        });

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

    it('should handle cases where no best practices are associated with findings', () => {
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
      const bestPracticeIdToFindingIdsAssociations = [
        {
          id: 0,
          start: 2,
          end: 2,
        },
      ];

      const result =
        findingToBestPracticesAssociationServiceGenAI.formatAIAssociations({
          bestPracticeIdToFindingIdsAssociations,
          findings,
          pillars,
        });

      expect(result).toEqual([
        {
          finding: findings[0],
          bestPractices: [],
        },
        {
          finding: findings[1],
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
  });

  describe('associateFindingsToBestPractices', () => {
    it('should associate findings to best practices', async () => {
      const { aiService, findingToBestPracticesAssociationServiceGenAI } =
        setup();
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
          { id: 0, start: 1, end: 1 },
          { id: 1, start: 2, end: 2 },
        ])
      );
      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          }
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
        .mockResolvedValueOnce(JSON.stringify([{ id: 0, start: 1, end: 1 }]));

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          }
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
        .mockResolvedValueOnce(JSON.stringify([{ invalid: 0, format: 1 }]))
        .mockResolvedValueOnce(JSON.stringify([{ id: 0, start: 1, end: 1 }]));

      const result =
        await findingToBestPracticesAssociationServiceGenAI.associateFindingsToBestPractices(
          {
            scanningTool: ScanningTool.PROWLER,
            findings,
            pillars,
          }
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

    it('should throw an error if max retries are exceeded', async () => {
      const {
        aiService,
        findingToBestPracticesAssociationServiceGenAI,
        maxRetries,
      } = setup();
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
          }
        )
      ).rejects.toThrowError();
      expect(aiService.converse).toHaveBeenCalledTimes(maxRetries + 1);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  register(tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries, {
    useValue: 3,
  });
  const findingToBestPracticesAssociationServiceGenAI =
    new FindingToBestPracticesAssociationServiceGenAI();
  return {
    aiService: inject(tokenAIService),
    maxRetries: inject(
      tokenFindingToBestPracticesAssociationServiceGenAIMaxRetries
    ),
    findingToBestPracticesAssociationServiceGenAI,
  };
};
