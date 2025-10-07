import { AssumeRoleCommand } from '@aws-sdk/client-sts';
import {
  AnswerSummary,
  Choice,
  CreateMilestoneCommand,
  CreateWorkloadCommand,
  GetAnswerCommand,
  GetLensReviewCommand,
  GetMilestoneCommand,
  ListAnswersCommand,
  ListMilestonesCommand,
  ListWorkloadsCommand,
  PillarReviewSummary,
  UpdateAnswerCommand,
  WellArchitectedClient,
  WorkloadEnvironment,
} from '@aws-sdk/client-wellarchitected';
import { mockClient } from 'aws-sdk-client-mock';

import {
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { tokenFakeAssessmentsRepository } from '../AssessmentsRepository';
import { tokenFakeQuestionSetService } from '../QuestionSetService';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { tokenSTSClient } from '../STSService';
import {
  tokenWellArchitectedClientConstructor,
  WAFRLens,
  WellArchitectedToolService,
} from './WellArchitectedToolService';

describe('WellArchitectedToolService', () => {
  describe('createWellArchitectedClient', () => {
    it('should create a new Well Architected client', async () => {
      const { wellArchitectedToolService, stsClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      const client =
        await wellArchitectedToolService.createWellArchitectedClient(
          roleArn,
          region,
        );

      expect(client).instanceOf(WellArchitectedClient);

      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input,
      ).toEqual(
        expect.objectContaining({
          RoleArn: roleArn,
          RoleSessionName: 'WAFR-Automation-Tool',
        }),
      );
    });

    it('should throw an error if the STS credentials are missing', async () => {
      const { wellArchitectedToolService, stsClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: undefined,
      });

      await expect(
        wellArchitectedToolService.createWellArchitectedClient(roleArn, region),
      ).rejects.toThrow(Error);
    });
  });

  describe('createWorkload', () => {
    it('should create a new workload if it does not exist', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: 'workload-id',
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(
          wellArchitectedClient,
          assessment,
          user,
        ),
      ).resolves.toEqual({
        workloadId: 'workload-id',
        workloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
      });
    });

    it('should throw an error if the workload creation fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: 'workload-id',
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(
          wellArchitectedClient,
          assessment,
          user,
        ),
      ).rejects.toThrow(Error);
    });

    it('should get the existing workload if it exists', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      const user = UserMother.basic().build();

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadArn:
              'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.createWorkload(
          wellArchitectedClient,
          assessment,
          user,
        ),
      ).resolves.toEqual({
        workloadId: 'workload-id',
        workloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
      });
    });
  });

  describe('getWorkloadLensReview', () => {
    it('should get lens review of the workload', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [],
        },
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        wellArchitectedToolService.getWorkloadLensReview(
          wellArchitectedClient,
          'workload-id',
        ),
      ).resolves.toEqual(
        expect.objectContaining({ PillarReviewSummaries: [] }),
      );

      const lensReviewCalls =
        wellArchitectedClientMock.commandCalls(GetLensReviewCommand);
      expect(lensReviewCalls.length).toBe(1);
      expect(lensReviewCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
        }),
      );
    });

    it('should throw an error if the workload lens review fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.getWorkloadLensReview(
          wellArchitectedClient,
          'workload-id',
        ),
      ).rejects.toThrow(Error);

      const lensReviewCalls =
        wellArchitectedClientMock.commandCalls(GetLensReviewCommand);
      expect(lensReviewCalls.length).toBe(1);
      expect(lensReviewCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
        }),
      );
    });
  });

  describe('listWorkloadPillarAnswers', () => {
    it('should list pillar answers of the workload', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

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
          wellArchitectedClient,
          'workload-id',
          'pillar-id',
        ),
      ).resolves.toEqual([anwerSummary]);

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(1);
      expect(listPillarAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        }),
      );
    });

    it('should throw an error if the list pillar answers fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.listWorkloadPillarAnswers(
          wellArchitectedClient,
          'workload-id',
          'pillar-id',
        ),
      ).rejects.toThrow(Error);

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(1);
      expect(listPillarAnswersCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          LensAlias: WAFRLens,
          PillarId: 'pillar-id',
        }),
      );
    });
  });

  describe('updateWorkloadAnswer', () => {
    it('should update answer of the workload', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      const question = QuestionMother.basic().withNone(false).build();

      await expect(
        wellArchitectedToolService.updateWorkloadAnswer(
          wellArchitectedClient,
          'workload-id',
          'question-id',
          [],
          question,
        ),
      ).resolves.toBeUndefined();

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
        }),
      );
    });

    it('should throw an error if the update answer fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      const question = QuestionMother.basic().withNone(false).build();

      await expect(
        wellArchitectedToolService.updateWorkloadAnswer(
          wellArchitectedClient,
          'workload-id',
          'question-id',
          [],
          question,
        ),
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
        }),
      );
    });
  });

  describe('exportAssessment', () => {
    it('should export the assessment to well architected tool', async () => {
      const {
        wellArchitectedToolService,
        stsClientMock,
        wellArchitectedClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .withPillars([
          PillarMother.basic()
            .withPrimaryId('pillar-id')
            .withLabel('Pillar 1')
            .withDisabled(false)
            .withQuestions([
              QuestionMother.basic()
                .withPrimaryId('question-id')
                .withLabel('Question 1')
                .withDisabled(false)
                .withNone(false)
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withPrimaryId('best-practice-id')
                    .withLabel('Best Practice 1')
                    .withChecked(true)
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();

      const user = UserMother.basic().build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolvesOnce({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadArn:
              'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
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

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      await wellArchitectedToolService.exportAssessment({
        roleArn,
        assessment,
        region,
        user,
      });

      expect(stsClientMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
      expect(
        stsClientMock.commandCalls(AssumeRoleCommand)[0].args[0].input,
      ).toEqual(
        expect.objectContaining({
          RoleArn: 'arn:aws:iam::123456789012:role/test-role',
          RoleSessionName: 'WAFR-Automation-Tool',
        }),
      );

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
        }),
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
      const { wellArchitectedToolService, wellArchitectedClient } = setup();

      const workflowPillar: PillarReviewSummary = {};
      await expect(
        wellArchitectedToolService.exportPillarList(
          wellArchitectedClient,
          'workload-id',
          [],
          [workflowPillar],
        ),
      ).rejects.toThrow(Error);
    });

    it('should throw an error if the pillar data is missing', async () => {
      const { wellArchitectedToolService, wellArchitectedClient } = setup();

      const workflowPillar: PillarReviewSummary = {
        PillarId: 'pillar-id',
        PillarName: 'Pillar 1',
      };
      await expect(
        wellArchitectedToolService.exportPillarList(
          wellArchitectedClient,
          'workload-id',
          [],
          [workflowPillar],
        ),
      ).rejects.toThrow(Error);
    });

    it('should continue if the pillar data is disabled', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClient,
        wellArchitectedClientMock,
      } = setup();

      const assessmentPillarList = [
        PillarMother.basic()
          .withPrimaryId('pillar-id')
          .withLabel('Pillar 1')
          .withDisabled(true)
          .build(),
      ];

      const workflowPillar: PillarReviewSummary = {
        PillarId: 'pillar-id',
        PillarName: 'Pillar 1',
      };

      await wellArchitectedToolService.exportPillarList(
        wellArchitectedClient,
        'workload-id',
        assessmentPillarList,
        [workflowPillar],
      );

      const listPillarAnswersCalls =
        wellArchitectedClientMock.commandCalls(ListAnswersCommand);
      expect(listPillarAnswersCalls.length).toBe(0);
    });

    it('should throw an error if the answer id, name or choiceList are missing', async () => {
      const { wellArchitectedToolService, wellArchitectedClient } = setup();

      const answerSummary: AnswerSummary = {};
      await expect(
        wellArchitectedToolService.exportAnswerList(
          wellArchitectedClient,
          'workload-id',
          [answerSummary],
          [],
        ),
      ).rejects.toThrow(Error);
    });

    it('should throw an error if the answer question data is missing', async () => {
      const { wellArchitectedToolService, wellArchitectedClient } = setup();

      const answerSummary: AnswerSummary = {
        QuestionId: 'question-id',
        QuestionTitle: 'Question 1',
        Choices: [],
      };
      await expect(
        wellArchitectedToolService.exportAnswerList(
          wellArchitectedClient,
          'workload-id',
          [answerSummary],
          [],
        ),
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
        wellArchitectedToolService.getAnswerSelectedChoiceList(
          answerChoiceList,
          questionData,
        );
      expect(selectedChoiceList).toEqual(['none-choice-id']);
    });

    it('should throw an error if the best practice id, name are missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerChoice: Choice = {};

      expect(() =>
        wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          [],
        ),
      ).toThrow(Error);
    });

    it('should throw an error if the best practice data is missing', async () => {
      const { wellArchitectedToolService } = setup();

      const answerChoice: Choice = {
        ChoiceId: 'choice-id',
        Title: 'Best Practice 1',
      };

      expect(() =>
        wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          [],
        ),
      ).toThrow(Error);
    });

    it('should not add the best practice to the selected list if the status is false', async () => {
      const { wellArchitectedToolService } = setup();

      const questionBestPracticeList = [
        BestPracticeMother.basic()
          .withPrimaryId('best-practice-id')
          .withLabel('Best Practice 1')
          .withChecked(false)
          .build(),
      ];

      const answerChoice: Choice = {
        ChoiceId: 'best-practice-id',
        Title: 'Best Practice 1',
      };

      const selectedChoiceList =
        wellArchitectedToolService.getSelectedBestPracticeList(
          [answerChoice],
          questionBestPracticeList,
        );
      expect(selectedChoiceList).toEqual([]);
    });
  });

  describe('createMilestone', () => {
    it('should create a workload if none exists for the assessment', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
        fakeAssessmentsRepository,
      } = setup();

      const user = UserMother.basic().build();

      const assessment = AssessmentMother.basic()
        .withOrganization(user.organizationDomain)
        .withName('assessment-name')
        .withRegions(['us-west-2'])
        .build();
      await fakeAssessmentsRepository.save(assessment);

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });
      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: 'workload-id',
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [],
        },
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateMilestoneCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await wellArchitectedToolService.createMilestone({
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        assessment,
        region: 'us-west-2',
        name: 'Milestone Name',
        user,
      });
      const createWorkloadCalls = wellArchitectedClientMock.commandCalls(
        CreateWorkloadCommand,
      );
      expect(createWorkloadCalls.length).toBe(1);
      expect(createWorkloadCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadName: `wafr-assessment-name-${assessment.id}`,
          Environment: WorkloadEnvironment.PRODUCTION,
          AwsRegions: assessment.regions,
        }),
      );
    });

    it('should export the assessment pillars', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
        fakeAssessmentsRepository,
      } = setup();

      const user = UserMother.basic().build();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization(user.organizationDomain)
        .withRegions(['us-west-2'])
        .withPillars([pillar])
        .build();
      await fakeAssessmentsRepository.save(assessment);

      const workloadId = 'workload-id';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });
      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: workloadId,
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: workloadId,
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [
            {
              PillarId: pillar.primaryId,
              PillarName: pillar.label,
            },
          ],
        },
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [
          {
            QuestionId: question.primaryId,
            QuestionTitle: question.label,
            Choices: [
              {
                ChoiceId: bestPractice.primaryId,
                Title: bestPractice.label,
              },
            ],
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateMilestoneCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await wellArchitectedToolService.createMilestone({
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        assessment,
        region: 'us-west-2',
        name: 'Milestone Name',
        user,
      });

      const updateAnswerCalls =
        wellArchitectedClientMock.commandCalls(UpdateAnswerCommand);
      expect(updateAnswerCalls.length).toBe(1);
      expect(updateAnswerCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: workloadId,
          LensAlias: WAFRLens,
          QuestionId: question.primaryId,
          SelectedChoices: [bestPractice.primaryId],
          IsApplicable: true,
        }),
      );
    });

    it('should create a new milestone for the assessment', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
        fakeAssessmentsRepository,
      } = setup();

      const user = UserMother.basic().build();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .withOrganization(user.organizationDomain)
        .build();
      await fakeAssessmentsRepository.save(assessment);

      const workloadId = 'workload-id';
      const milestoneName = 'Milestone Name';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });
      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: workloadId,
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: workloadId,
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [],
        },
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateMilestoneCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await wellArchitectedToolService.createMilestone({
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        assessment,
        region: 'us-west-2',
        name: milestoneName,
        user,
      });

      const createMilestoneCalls = wellArchitectedClientMock.commandCalls(
        CreateMilestoneCommand,
      );
      expect(createMilestoneCalls.length).toBe(1);
      expect(createMilestoneCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: workloadId,
          MilestoneName: milestoneName,
        }),
      );
    });

    it('should throw an error if the milestone creation fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
        fakeAssessmentsRepository,
      } = setup();

      const user = UserMother.basic().build();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .withOrganization(user.organizationDomain)
        .build();
      await fakeAssessmentsRepository.save(assessment);

      const workloadId = 'workload-id';

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });
      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: workloadId,
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateWorkloadCommand).resolves({
        WorkloadId: workloadId,
        WorkloadArn:
          'arn:aws:wellarchitected:us-west-2:123456789012:workload/workload-id',
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(GetLensReviewCommand).resolves({
        LensReview: {
          PillarReviewSummaries: [],
        },
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(ListAnswersCommand).resolves({
        AnswerSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(UpdateAnswerCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      wellArchitectedClientMock.on(CreateMilestoneCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        wellArchitectedToolService.createMilestone({
          roleArn: 'arn:aws:iam::123456789012:role/test-role',
          assessment,
          region: 'us-west-2',
          name: 'Milestone Name',
          user,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('getMilestone', () => {
    it('should get pillars from a milestone', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
        fakeQuestionSetService,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      // Mock the question set service to return pillars
      vi.spyOn(fakeQuestionSetService, 'get').mockReturnValue({
        pillars: [
          PillarMother.basic()
            .withPrimaryId('pillar-id')
            .withLabel('Pillar 1')
            .withQuestions([
              QuestionMother.basic()
                .withPrimaryId('question-id')
                .withLabel('Question 1')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withPrimaryId('best-practice-id')
                    .withLabel('Best Practice 1')
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ],
        version: '1.0.0',
      });

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(GetMilestoneCommand).resolves({
        Milestone: {
          MilestoneNumber: 1,
          Workload: {
            WorkloadId: 'milestone-workload-id',
          },
          MilestoneName: 'Milestone Name',
          RecordedAt: new Date('2023-10-01T00:00:00Z'),
        },
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(GetAnswerCommand).resolves({
        Answer: {
          PillarId: 'pillar-id',
          QuestionId: 'question-id',
          QuestionTitle: 'Question 1',
          Choices: [
            {
              ChoiceId: 'best-practice-id',
              Title: 'Best Practice 1',
            },
          ],
          SelectedChoices: ['best-practice-id'],
        },
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';
      const milestoneId = 1;

      const result = await wellArchitectedToolService.getMilestone({
        roleArn,
        assessment,
        region,
        milestoneId,
      });

      expect(result).toEqual({
        id: 1,
        name: 'Milestone Name',
        createdAt: new Date('2023-10-01T00:00:00Z'),
        pillars: [
          expect.objectContaining({
            primaryId: 'pillar-id',
            label: 'Pillar 1',
            questions: [
              expect.objectContaining({
                primaryId: 'question-id',
                label: 'Question 1',
                bestPractices: [
                  expect.objectContaining({
                    primaryId: 'best-practice-id',
                    label: 'Best Practice 1',
                    checked: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const getMilestoneCalls =
        wellArchitectedClientMock.commandCalls(GetMilestoneCommand);
      expect(getMilestoneCalls.length).toBe(1);
      expect(getMilestoneCalls[0].args[0].input).toEqual(
        expect.objectContaining({
          WorkloadId: 'workload-id',
          MilestoneNumber: 1,
        }),
      );
    });

    it('should throw an error if workload is not found', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';
      const milestoneId = 1;

      await expect(
        wellArchitectedToolService.getMilestone({
          roleArn,
          assessment,
          region,
          milestoneId,
        }),
      ).rejects.toThrow(Error);
    });

    it('should return undefined if milestone is not found', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(GetMilestoneCommand).resolves({
        Milestone: {},
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';
      const milestoneId = 1;

      await expect(
        wellArchitectedToolService.getMilestone({
          roleArn,
          assessment,
          region,
          milestoneId,
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw an error if milestone has no WorkloadId', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(GetMilestoneCommand).resolves({
        Milestone: {
          MilestoneNumber: 1,
          Workload: {},
          MilestoneName: 'Milestone Name',
          RecordedAt: new Date('2023-10-01T00:00:00Z'),
        },
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';
      const milestoneId = 1;

      await expect(
        wellArchitectedToolService.getMilestone({
          roleArn,
          assessment,
          region,
          milestoneId,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('getMilestones', () => {
    it('should get milestones for an assessment', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const recordedAt = new Date('2023-01-01T00:00:00.000Z');
      wellArchitectedClientMock.on(ListMilestonesCommand).resolves({
        MilestoneSummaries: [
          {
            MilestoneNumber: 1,
            MilestoneName: 'Milestone 1',
            RecordedAt: recordedAt,
          },
          {
            MilestoneNumber: 2,
            MilestoneName: 'Milestone 2',
            RecordedAt: recordedAt,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      const result = await wellArchitectedToolService.getMilestones({
        roleArn,
        assessment,
        region,
        limit: 10,
      });

      expect(result).toEqual({
        milestones: [
          {
            id: 1,
            name: 'Milestone 1',
            createdAt: recordedAt,
          },
          {
            id: 2,
            name: 'Milestone 2',
            createdAt: recordedAt,
          },
        ],
        nextToken: undefined,
      });
    });

    it('should handle pagination when listing milestones without nextToken', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const recordedAt = new Date('2023-01-01T00:00:00.000Z');
      wellArchitectedClientMock.on(ListMilestonesCommand).resolves({
        MilestoneSummaries: [
          {
            MilestoneNumber: 1,
            MilestoneName: 'Milestone 1',
            RecordedAt: recordedAt,
          },
        ],
        NextToken: 'next-token',
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      const result = await wellArchitectedToolService.getMilestones({
        roleArn,
        assessment,
        region,
        limit: 1,
      });

      expect(result).toEqual({
        milestones: [
          {
            id: 1,
            name: 'Milestone 1',
            createdAt: recordedAt,
          },
        ],
        nextToken: 'next-token',
      });

      const listMilestonesCalls = wellArchitectedClientMock.commandCalls(
        ListMilestonesCommand,
      );
      expect(listMilestonesCalls.length).toBe(1);
    });

    it('should handle pagination when listing milestones with nextToken', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-assessment-name-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const recordedAt = new Date('2023-01-01T00:00:00.000Z');
      wellArchitectedClientMock.on(ListMilestonesCommand).resolves({
        MilestoneSummaries: [
          {
            MilestoneNumber: 1,
            MilestoneName: 'Milestone 1',
            RecordedAt: recordedAt,
          },
          {
            MilestoneNumber: 2,
            MilestoneName: 'Milestone 2',
            RecordedAt: recordedAt,
          },
        ],
        NextToken: undefined,
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      const result = await wellArchitectedToolService.getMilestones({
        roleArn,
        assessment,
        region,
        limit: 1,
        nextToken: 'next-token',
      });

      expect(result).toEqual({
        milestones: [
          {
            id: 1,
            name: 'Milestone 1',
            createdAt: recordedAt,
          },
          {
            id: 2,
            name: 'Milestone 2',
            createdAt: recordedAt,
          },
        ],
        nextToken: undefined,
      });
    });

    it('should throw an error if workload is not found', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [],
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      await expect(
        wellArchitectedToolService.getMilestones({
          roleArn,
          assessment,
          region,
        }),
      ).rejects.toThrow(Error);
    });

    it('should throw an error if list milestones fails', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(ListMilestonesCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      await expect(
        wellArchitectedToolService.getMilestones({
          roleArn,
          assessment,
          region,
        }),
      ).rejects.toThrow(Error);
    });

    it('should throw an error if milestone data is incomplete', async () => {
      const {
        wellArchitectedToolService,
        wellArchitectedClientMock,
        stsClientMock,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withName('assessment-name')
        .build();

      stsClientMock.on(AssumeRoleCommand).resolves({
        Credentials: {
          AccessKeyId: 'access-key-id',
          SecretAccessKey: 'secret-access-key',
          SessionToken: 'session-token',
          Expiration: new Date(),
        },
      });

      wellArchitectedClientMock.on(ListWorkloadsCommand).resolves({
        WorkloadSummaries: [
          {
            WorkloadId: 'workload-id',
            WorkloadName: `wafr-${assessment.name}-${assessment.id}`,
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      wellArchitectedClientMock.on(ListMilestonesCommand).resolves({
        MilestoneSummaries: [
          {
            MilestoneNumber: 1,
            // Missing MilestoneName and RecordedAt
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const region = 'us-west-2';

      await expect(
        wellArchitectedToolService.getMilestones({
          roleArn,
          assessment,
          region,
        }),
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const wellArchitectedClient = new WellArchitectedClient();
  register(tokenWellArchitectedClientConstructor, {
    useFactory: () => {
      return () => wellArchitectedClient;
    },
  });

  const wellArchitectedToolService = new WellArchitectedToolService();
  const wellArchitectedClientMock = mockClient(wellArchitectedClient);
  const stsClientMock = mockClient(inject(tokenSTSClient));
  return {
    wellArchitectedToolService,
    stsClientMock,
    wellArchitectedClient,
    wellArchitectedClientMock,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeQuestionSetService: inject(tokenFakeQuestionSetService),
  };
};
