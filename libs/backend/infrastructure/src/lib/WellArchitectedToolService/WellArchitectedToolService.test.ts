import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

import {
  AnswerSummary,
  Choice,
  CreateWorkloadCommand,
  GetLensReviewCommand,
  ListAnswersCommand,
  ListWorkloadsCommand,
  PillarReviewSummary,
  UpdateAnswerCommand,
} from '@aws-sdk/client-wellarchitected';
import {
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  tokenWellArchitectedClient,
  WAFRLens,
  WellArchitectedToolService,
} from './WellArchitectedToolService';

describe('wellArchitectedTool Infrastructure', () => {
  describe('createWorkload', () => {
    it('should create a new workload if it does not exist', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: 'workload-id',
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(assessment, user)
      ).resolves.toEqual('workload-id');
    });

    it('should throw an error if the workload creation fails', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: 'workload-id',
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(assessment, user)
      ).rejects.toThrow(Error);
    });

    it('should get the existing workload if it exists', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: 'wafr-assessment-name-assessment-id',
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(assessment, user)
      ).resolves.toEqual('workload-id');
    });
  });
  describe('getWorkloadLensReview', () => {
    it('should get lens review of the workload', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [],
        },
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.getWorkloadLensReview('workload-id')
      ).resolves.toEqual(
        expect.objectContaining({ PillarReviewSummaries: [] })
      );

      const lensReviewCalls =
        wellArchitectedClientMock.commandCalls(GetLensReviewCommand);
      expect(lensReviewCalls.length).toBe(1);
      expect(lensReviewCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
        })
      );
    });

    it('should throw an error if the workload lens review fails', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.getWorkloadLensReview('workload-id')
      ).rejects.toThrow(Error);

      const lensReviewCalls =
        wellArchitectedClientMock.commandCalls(GetLensReviewCommand);
      expect(lensReviewCalls.length).toBe(1);
      expect(lensReviewCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
        })
      );
    });
  });
  describe('listWorkloadPillarAnswers', () => {
    it('should list pillar answers of the workload', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const anwerSummary: AnswerSummary = {
        PillarId: 'pillar-id',
        QuestionId: 'question-id',
        QuestionTitle: 'Question 1',
        Choices: [
          {
            ChoiceId: 'choice-id',
            Title: 'Best Practice 1',
          },
        ],
      };

      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [anwerSummary],
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.listWorkloadPillarAnswers(
          'workload-id',
          'pillar-id'
        )
      ).resolves.toEqual([anwerSummary]);

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(1);
      expect(listPillarAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        })
      );
    });

    it('should throw an error if the list pillar answers fails', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.listWorkloadPillarAnswers(
          'workload-id',
          'pillar-id'
        )
      ).rejects.toThrow(Error);

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(1);
      expect(listPillarAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        })
      );
    });
  });
  describe('updateWorkloadAnswer', () => {
    it('should update answer of the workload', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.listWorkloadPillarAnswers(
          'workload-id',
          'pillar-id'
        )
      ).resolves.toEqual([]);

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(1);
      expect(listPillarAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        })
      );
    });

    it('should throw an error if the update answer fails', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      const question = QuestionMother.basic().withNone(false).build();

      await expect(
        wellArchitectedToolService.updateWorkloadAnswer(
          'workload-id',
          'question-id',
          [],
          question
        )
      ).rejects.toThrow(Error);

      const updateAnswersCalls =
        wellArchitectedClientMock.commandCalls(UpdateAnswerCommand);
      expect(updateAnswersCalls.length).toBe(1);
      expect(updateAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          QuestionId: 'question-id',
          SelectedChoices: [],
          IsApplicable: true,
        })
      );
    });
  });
  describe('exportAssessment', () => {
    it('should export the assessment to well architected tool', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .withFindings([
          PillarMother.basic()
            .withId('pillar-id')
            .withLabel('Pillar 1')
            .withDisabled(false)
            .withQuestions([
              QuestionMother.basic()
                .withId('question-id')
                .withLabel('Question 1')
                .withDisabled(false)
                .withNone(false)
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('best-practice-id')
                    .withLabel('Best Practice 1')
                    .withStatus(true)
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolvesOnce({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: 'wafr-assessment-name-assessment-id',
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(GetLensReviewCommand).resolvesOnce({
        LensReview: {
          PillarReviewSummaries: [
            {
              PillarId: 'pillar-id',
              PillarName: 'Pillar 1',
            },
          ],
        },
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(ListAnswersCommand).resolvesOnce({
        AnswerSummaries: [
          {
            QuestionId: 'question-id',
            QuestionTitle: 'Question 1',
            Choices: [
              {
                ChoiceId: 'best-practice-id',
                Title: 'Best Practice 1',
              },
            ],
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(UpdateAnswerCommand).resolvesOnce({
        $metadata: { httpStatusCode: 200 },
      });

      await wellArchitectedToolService.exportAssessment(assessment, user);

      const listWorkloadsCalls =
        wellArchitectedClientMock.commandCalls(ListWorkloadsCommand);
      expect(listWorkloadsCalls.length).toBe(1);
      expect(listWorkloadsCalls[0].args[0].input).toEqual({});

      const getLensReviewCalls =
        wellArchitectedClientMock.commandCalls(GetLensReviewCommand);
      expect(getLensReviewCalls.length).toBe(1);
      expect(getLensReviewCalls[0].args[0].input).toEqual({
        WorkloadId: 'workload-id',
        LensAlias: WAFRLens,
      });

      const listAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listAnswersCalls.length).toBe(1);
      expect(listAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        })
      );

      const updateAnswerCalls =
        wellArchitectedClientMock.commandCalls(UpdateAnswerCommand);
      expect(updateAnswerCalls.length).toBe(1);
      expect(updateAnswerCalls[0].args[0].input).toEqual({
        WorkloadId: 'workload-id',
        LensAlias: WAFRLens,
        QuestionId: 'question-id',
        SelectedChoices: ['best-practice-id'],
        IsApplicable: true,
      });
    });

    it('should throw an error if the pillar id or name are missing', async () => {
      const { wellArchitectedToolService } = setup();

      const workflowPillar: PillarReviewSummary = {};
      await expect(
        wellArchitectedToolService.exportPillarList(
          'workload-id',
          [],
          [workflowPillar]
        )
      ).rejects.toThrow(Error);
    });

    it('should throw an error if the pillar data is missing', async () => {
      const { wellArchitectedToolService } = setup();

      const workflowPillar: PillarReviewSummary = {
        PillarId: 'pillar-id',
        PillarName: 'Pillar 1',
      };
      await expect(
        wellArchitectedToolService.exportPillarList(
          'workload-id',
          [],
          [workflowPillar]
        )
      ).rejects.toThrow(Error);
    });

    it('should continue if the pillar data is disabled', async () => {
      const { wellArchitectedToolService, wellArchitectedClientMock } = setup();

      const assessmentPillarList = [
        PillarMother.basic().withLabel('Pillar 1').withDisabled(true).build(),
      ];

      const workflowPillar: PillarReviewSummary = {
        PillarId: 'pillar-id',
        PillarName: 'Pillar 1',
      };

      await wellArchitectedToolService.exportPillarList(
        'workload-id',
        assessmentPillarList,
        [workflowPillar]
      );

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(0);
    });

    it('should throw an error if the answer id, name or choiceList are missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerSummary: AnswerSummary = {};
      await expect(
        wellArchitectedToolService.exportAnswerList(
          'workload-id',
          [answerSummary],
          []
        )
      ).rejects.toThrow(Error);
    });

    it('should throw an error if the answer question data is missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerSummary: AnswerSummary = {
        QuestionId: 'question-id',
        QuestionTitle: 'Question 1',
        Choices: [],
      };
      await expect(
        wellArchitectedToolService.exportAnswerList(
          'workload-id',
          [answerSummary],
          []
        )
      ).rejects.toThrow(Error);
    });

    it('should return a list of selected choices containing the none choice', async () => {
      const { wellArchitectedToolService } = setup();

      const questionData = QuestionMother.basic()
        .withLabel('Question 1')
        .withNone(true)
        .build();

      const answerChoiceList: Choice[] = [
        {
          ChoiceId: 'none-choice-id',
          Title: 'None of these',
        },
      ];
      const selectedChoiceList =
        await wellArchitectedToolService.getAnswerSelectedChoiceList(
          answerChoiceList,
          questionData
        );
      expect(selectedChoiceList).toEqual(['none-choice-id']);
    });

    it('should throw an error if the best practice id, name are missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerChoice: Choice = {};

      await expect(
        wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          []
        )
      ).rejects.toThrow(Error);
    });

    it('should throw an error if the best practice data is missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerChoice: Choice = {
        ChoiceId: 'choice-id',
        Title: 'Best Practice 1',
      };

      await expect(
        wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          []
        )
      ).rejects.toThrow(Error);
    });

    it('should not add the best practice to the selected list if the status is false', async () => {
      const { wellArchitectedToolService } = setup();

      const questionBestPracticeList = [
        BestPracticeMother.basic()
          .withId('best-practice-id')
          .withLabel('Best Practice 1')
          .withStatus(false)
          .build(),
      ];

      const answerChoice: Choice = {
        ChoiceId: 'best-practice-id',
        Title: 'Best Practice 1',
      };

      const selectedChoiceList =
        await wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          questionBestPracticeList
        );
      expect(selectedChoiceList).toEqual([]);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const wellArchitectedToolService = new WellArchitectedToolService();
  const wellArchitectedClientMock = mockClient(
    inject(tokenWellArchitectedClient)
  );
  return {
    wellArchitectedToolService,
    wellArchitectedClientMock,
  };
};
