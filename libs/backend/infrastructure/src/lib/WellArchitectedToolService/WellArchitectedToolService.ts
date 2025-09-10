import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import {
  Answer,
  AnswerSummary,
  Choice,
  CreateMilestoneCommand,
  CreateWorkloadCommand,
  GetAnswerCommand,
  GetLensReviewCommand,
  GetMilestoneCommand,
  LensReview,
  ListAnswersCommand,
  ListMilestonesCommand,
  ListWorkloadsCommand,
  ListWorkloadsCommandOutput,
  Milestone as AWSMilestone,
  PillarReviewSummary,
  UpdateAnswerCommand,
  WellArchitectedClient,
  WellArchitectedClientConfig,
  WellArchitectedServiceException,
  WorkloadEnvironment,
  WorkloadSummary,
} from '@aws-sdk/client-wellarchitected';

import {
  Assessment,
  BestPractice,
  Milestone,
  MilestoneSummary,
  Pillar,
  Question,
  User,
} from '@backend/models';
import type { WellArchitectedToolPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';
import { tokenQuestionSetService } from '../QuestionSetService';

export const WAFRLens = 'wellarchitected';

export class WellArchitectedToolService implements WellArchitectedToolPort {
  private readonly stsClient = inject(tokenSTSClient);
  private readonly logger = inject(tokenLogger);
  private readonly wellArchitectedClientConstructor = inject(
    tokenWellArchitectedClientConstructor
  );
  private readonly questionSetService = inject(tokenQuestionSetService);

  public async createWellArchitectedClient(
    roleArn: string,
    region: string
  ): Promise<WellArchitectedClient> {
    const credentials = await this.stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: 'WAFR-Automation-Tool',
      })
    );
    if (!credentials.Credentials) {
      throw new Error(`Failed to assume role: ${roleArn}`);
    }
    return this.wellArchitectedClientConstructor({
      credentials: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        accessKeyId: credentials.Credentials.AccessKeyId!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        secretAccessKey: credentials.Credentials.SecretAccessKey!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sessionToken: credentials.Credentials.SessionToken!,
      },
      region,
    });
  }

  private async getWorkloadSummary(
    wellArchitectedClient: WellArchitectedClient,
    workloadName: string
  ): Promise<WorkloadSummary | null> {
    let workloadNextToken = undefined;
    do {
      const workloads: ListWorkloadsCommandOutput =
        await wellArchitectedClient.send(
          new ListWorkloadsCommand({
            NextToken: workloadNextToken,
          })
        );
      workloadNextToken = workloads.NextToken;
      const workloadSummaries = workloads.WorkloadSummaries ?? [];
      const workloadSummary = workloadSummaries.find(
        (workload) => workload.WorkloadName === workloadName
      );
      if (workloadSummary) return workloadSummary;
    } while (workloadNextToken);
    return null;
  }

  private getWorkloadName(assessment: Assessment): string {
    return `wafr-${assessment.name.replace(' ', '-')}-${assessment.id}`;
  }

  public async getWorkload(
    wellArchitectedClient: WellArchitectedClient,
    assessment: Assessment
  ): Promise<WorkloadSummary | null> {
    const workloadName = this.getWorkloadName(assessment);
    const workload = await this.getWorkloadSummary(
      wellArchitectedClient,
      workloadName
    );
    if (!workload || !workload.WorkloadId) {
      this.logger.warn(`Workload not found for assessment: ${assessment.name}`);
      return null;
    }
    return workload;
  }

  public async createWorkload(
    wellArchitectedClient: WellArchitectedClient,
    assessment: Assessment,
    user: User
  ): Promise<string> {
    const workload = await this.getWorkload(wellArchitectedClient, assessment);
    if (workload && workload.WorkloadId) {
      return workload.WorkloadId;
    }
    const command = new CreateWorkloadCommand({
      WorkloadName: this.getWorkloadName(assessment),
      Description: `WAFR Automation Tool Assessment: ${assessment.name}`,
      Environment: WorkloadEnvironment.PRODUCTION,
      Lenses: [WAFRLens],
      AwsRegions:
        assessment.regions.length > 0 ? assessment.regions : ['us-west-2'],
      ReviewOwner: `WAFR Automation Tool - ${user.email}`,
      Tags: {
        Owner: user.email,
        Project: 'WAFR Automation Tool',
        Name: assessment.name,
      },
    });
    const response = await wellArchitectedClient.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.WorkloadId) {
      throw new Error(
        `Failed to create workload: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.WorkloadId;
  }

  public async getWorkloadLensReview(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string
  ): Promise<LensReview | undefined> {
    const command = new GetLensReviewCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
    });
    const response = await wellArchitectedClient.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.LensReview) {
      throw new Error(
        `Failed to get workload lens review: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.LensReview;
  }

  public async listWorkloadPillarAnswers(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    pillarId: string
  ): Promise<AnswerSummary[]> {
    const command = new ListAnswersCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
      PillarId: pillarId,
      MaxResults: 50,
    });
    const response = await wellArchitectedClient.send(command);
    if (
      response.$metadata.httpStatusCode !== 200 ||
      !response.AnswerSummaries
    ) {
      throw new Error(
        `Failed to get workload pillar answers: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.AnswerSummaries;
  }

  public async getWorkloadQuestionAnswer(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    questionId: string,
    milestoneId?: number
  ): Promise<Answer | undefined> {
    const command = new GetAnswerCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
      QuestionId: questionId,
      MilestoneNumber: milestoneId,
    });
    const response = await wellArchitectedClient.send(command);
    if (
      response.$metadata.httpStatusCode !== 200 ||
      !response.Answer ||
      !response.Answer.Choices
    ) {
      throw new Error(
        `Failed to get workload question answer: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.Answer;
  }

  public async updateWorkloadAnswer(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    questionId: string,
    selectedChoices: string[],
    questionData: Question
  ): Promise<void> {
    const command = new UpdateAnswerCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
      QuestionId: questionId,
      SelectedChoices: selectedChoices,
      IsApplicable: questionData.none ? false : true,
    });
    const response = await wellArchitectedClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to update workload answer: ${response.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(`Updated Workload answer for ${questionId}`);
  }

  public getSelectedBestPracticeList(
    answerChoiceList: Choice[],
    questionBestPracticeList: BestPractice[]
  ): string[] {
    return answerChoiceList
      .map(({ ChoiceId: id, Title: title }) => {
        if (!id || !title) {
          throw new Error(
            `Workflow pillar question best practice ${id} has no ChoiceId or Title`
          );
        }
        const data = questionBestPracticeList.find((bp) => bp.primaryId === id);
        if (!data) {
          throw new Error(
            `Workflow pillar question best practice ${id} does not exist in assessment pillars`
          );
        }
        return { id, checked: data.checked };
      })
      .filter((item) => item.checked)
      .map((item) => item.id);
  }

  public getAnswerSelectedChoiceList(
    answerChoiceList: Choice[],
    answerQuestionData: Question
  ): string[] {
    const noneChoiceId = answerChoiceList.find(
      (choice) => choice.Title === 'None of these'
    )?.ChoiceId;
    if (answerQuestionData.none && noneChoiceId) {
      return [noneChoiceId];
    }
    const filteredChoices = noneChoiceId
      ? answerChoiceList.filter((choice) => choice.ChoiceId !== noneChoiceId)
      : answerChoiceList;
    return this.getSelectedBestPracticeList(
      filteredChoices,
      answerQuestionData.bestPractices
    );
  }

  public async exportAnswerList(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    pillarAnswerList: AnswerSummary[],
    pillarQuestionList: Question[]
  ): Promise<void> {
    for (const answer of pillarAnswerList) {
      const {
        QuestionId: answerQuestionId,
        QuestionTitle: answerQuestionTitle,
        Choices: answerChoiceList,
      } = answer;
      if (!answerQuestionId || !answerQuestionTitle || !answerChoiceList) {
        throw new Error(
          `Workflow pillar question ${answerQuestionId} has no QuestionId, QuestionTitle or Choices`
        );
      }
      const answerQuestionData = pillarQuestionList.find(
        (answer) => answer.primaryId === answerQuestionId
      );
      if (!answerQuestionData) {
        throw new Error(
          `Workflow pillar question ${answerQuestionId} does not exist in assessment pillars`
        );
      }
      const answerSelectedChoiceList = this.getAnswerSelectedChoiceList(
        answerChoiceList,
        answerQuestionData
      );
      await this.updateWorkloadAnswer(
        wellArchitectedClient,
        workloadId,
        answerQuestionId,
        answerSelectedChoiceList,
        answerQuestionData
      );
    }
  }

  public async exportPillarList(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    assessmentPillarList: Pillar[],
    workloadPillarList: PillarReviewSummary[]
  ): Promise<void> {
    for (const pillar of workloadPillarList) {
      const { PillarId: pillarId, PillarName: pillarName } = pillar;
      if (!pillarId || !pillarName) {
        throw new Error(
          `Workflow pillar ${pillarId} has no PillarId or PillarName`
        );
      }
      const pillarData = assessmentPillarList.find(
        (pillar) => pillar.primaryId === pillarId
      );
      if (!pillarData) {
        throw new Error(
          `Workflow pillar ${pillarId} does not exist in assessment pillars`
        );
      }
      if (pillarData.disabled) {
        this.logger.info(
          `Workflow pillar ${pillarId} is disabled, skipping export`
        );
        continue;
      }
      const pillarAnswerList = await this.listWorkloadPillarAnswers(
        wellArchitectedClient,
        workloadId,
        pillarId
      );
      const pillarQuestionList = pillarData.questions;
      await this.exportAnswerList(
        wellArchitectedClient,
        workloadId,
        pillarAnswerList,
        pillarQuestionList
      );
    }
  }

  public async exportAssessment(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    user: User;
  }): Promise<string> {
    const { roleArn, assessment, region, user } = args;
    const wellArchitectedClient = await this.createWellArchitectedClient(
      roleArn,
      region
    );
    const assessmentPillarList = assessment.pillars ?? [];
    const workloadId = await this.createWorkload(
      wellArchitectedClient,
      assessment,
      user
    );
    const workloadLensReview = await this.getWorkloadLensReview(
      wellArchitectedClient,
      workloadId
    );
    const workloadPillarList = workloadLensReview?.PillarReviewSummaries ?? [];
    await this.exportPillarList(
      wellArchitectedClient,
      workloadId,
      assessmentPillarList,
      workloadPillarList
    );
    return workloadId;
  }

  public async createMilestone(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    name: string;
    user: User;
  }): Promise<void> {
    const { roleArn, assessment, region, name } = args;
    const wellArchitectedClient = await this.createWellArchitectedClient(
      roleArn,
      region
    );
    const workloadId = await this.exportAssessment(args);
    const res = await wellArchitectedClient.send(
      new CreateMilestoneCommand({
        WorkloadId: workloadId,
        MilestoneName: name,
      })
    );
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to create milestone: ${res.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(
      `Created milestone for assessment ${assessment.name} with workload ID ${workloadId}`
    );
  }

  public async getAWSMilestone(
    wellArchitectedClient: WellArchitectedClient,
    workloadId: string,
    milestoneNumber: number
  ): Promise<AWSMilestone | undefined> {
    const command = new GetMilestoneCommand({
      WorkloadId: workloadId,
      MilestoneNumber: milestoneNumber,
    });
    const response = await wellArchitectedClient
      .send(command)
      .catch((error) => {
        if (
          error instanceof WellArchitectedServiceException &&
          error.$metadata?.httpStatusCode === 404
        ) {
          return undefined;
        }
        throw error;
      });
    if (!response) {
      return undefined;
    }
    if (response.$metadata.httpStatusCode !== 200 || !response.Milestone) {
      throw new Error(
        `Failed to get milestone ${milestoneNumber} for workload ${workloadId}: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.Milestone;
  }

  private async getPillarQuestionsFromMilestonePillar(args: {
    wellArchitectedClient: WellArchitectedClient;
    pillar: Pillar;
    workloadId: string;
    milestoneId: number;
  }): Promise<Question[]> {
    const { wellArchitectedClient, pillar, workloadId, milestoneId } = args;
    return Promise.all(
      pillar.questions.map<Promise<Question>>(async (question) => {
        const questionPrimaryId = question.primaryId;
        const answer = await this.getWorkloadQuestionAnswer(
          wellArchitectedClient,
          workloadId,
          questionPrimaryId,
          milestoneId
        );
        if (!answer || answer.SelectedChoices === undefined) {
          throw new Error(
            `Answer for question ${questionPrimaryId} not found in Milestone#${milestoneId}`
          );
        }
        const selectedBestPracticePrimaryIds = answer.SelectedChoices;
        const noneChoiceId = answer.Choices?.find(
          (choice) => choice.Title === 'None of these'
        )?.ChoiceId;
        const noneSelected =
          !!noneChoiceId &&
          selectedBestPracticePrimaryIds.includes(noneChoiceId);
        return {
          ...question,
          none: noneSelected,
          bestPractices: question.bestPractices.map<BestPractice>(
            (bestPractice) => {
              const isSelected = selectedBestPracticePrimaryIds.includes(
                bestPractice.primaryId
              );
              return {
                ...bestPractice,
                checked: !noneSelected && isSelected,
              };
            }
          ),
        };
      })
    );
  }

  private async getPillarsFromMilestone(args: {
    wellArchitectedClient: WellArchitectedClient;
    milestoneWorkloadId: string;
    milestoneId: number;
  }): Promise<Pillar[]> {
    const { wellArchitectedClient, milestoneWorkloadId, milestoneId } = args;
    const { pillars } = this.questionSetService.get();
    return Promise.all(
      pillars.map<Promise<Pillar>>(async (pillar) => {
        const milestonePillarQuestions =
          await this.getPillarQuestionsFromMilestonePillar({
            wellArchitectedClient,
            pillar,
            workloadId: milestoneWorkloadId,
            milestoneId,
          });
        return {
          ...pillar,
          questions: milestonePillarQuestions,
        };
      })
    );
  }

  public async getMilestone(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    milestoneId: number;
  }): Promise<Milestone | undefined> {
    const { roleArn, assessment, region, milestoneId } = args;
    const wellArchitectedClient = await this.createWellArchitectedClient(
      roleArn,
      region
    );
    const assessmentWorkload = await this.getWorkload(
      wellArchitectedClient,
      assessment
    );
    if (!assessmentWorkload || !assessmentWorkload.WorkloadId) {
      throw new Error(`Workload not found for assessment ${assessment.id}`);
    }
    const milestone = await this.getAWSMilestone(
      wellArchitectedClient,
      assessmentWorkload.WorkloadId,
      milestoneId
    );
    if (!milestone || !milestone.MilestoneNumber || !milestone.Workload) {
      return undefined;
    }
    if (!milestone.RecordedAt || !milestone.MilestoneName) {
      throw new Error(`Milestone#${milestoneId} is missing required fields`);
    }
    const milestoneWorkloadId = milestone.Workload.WorkloadId;
    if (!milestoneWorkloadId) {
      throw new Error(`Milestone#${milestoneId} has no WorkloadId`);
    }
    return {
      id: milestone.MilestoneNumber,
      name: milestone.MilestoneName,
      createdAt: milestone.RecordedAt,
      pillars: await this.getPillarsFromMilestone({
        wellArchitectedClient,
        milestoneWorkloadId,
        milestoneId,
      }),
    };
  }

  public async listAWSMilestones(
    wellarchitectedClient: WellArchitectedClient,
    workloadId: string,
    options?: {
      maxResults?: number;
      nextToken?: string;
    }
  ): Promise<{ awsMilestones: AWSMilestone[]; nextToken?: string }> {
    const command = new ListMilestonesCommand({
      WorkloadId: workloadId,
      MaxResults: options?.maxResults,
      NextToken: options?.nextToken,
    });
    const response = await wellarchitectedClient.send(command);
    if (
      response.$metadata.httpStatusCode !== 200 ||
      !response.MilestoneSummaries
    ) {
      throw new Error(
        `Failed to list milestones for workload ${workloadId}: ${response.$metadata.httpStatusCode}`
      );
    }
    return {
      awsMilestones: response.MilestoneSummaries,
      nextToken: response.NextToken,
    };
  }

  public async getMilestones(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    limit?: number;
    nextToken?: string;
  }): Promise<{
    milestones: MilestoneSummary[];
    nextToken?: string;
  }> {
    const { roleArn, assessment, region, limit, nextToken } = args;
    const wellArchitectedClient = await this.createWellArchitectedClient(
      roleArn,
      region
    );

    const assessmentWorkload = await this.getWorkload(
      wellArchitectedClient,
      assessment
    );
    if (!assessmentWorkload || !assessmentWorkload.WorkloadId) {
      throw new Error(`Workload not found for assessment ${assessment.id}`);
    }

    // Paginated request
    const { awsMilestones, nextToken: responseNextToken } =
      await this.listAWSMilestones(
        wellArchitectedClient,
        assessmentWorkload.WorkloadId,
        {
          maxResults: limit,
          nextToken,
        }
      );

    const milestones: MilestoneSummary[] = [];
    for (const milestoneSummary of awsMilestones) {
      if (
        !milestoneSummary.MilestoneNumber ||
        !milestoneSummary.MilestoneName ||
        !milestoneSummary.RecordedAt
      ) {
        throw new Error(
          `Milestone#${milestoneSummary.MilestoneNumber} has no id, name or createdAt`
        );
      }
      milestones.push({
        id: milestoneSummary.MilestoneNumber,
        name: milestoneSummary.MilestoneName,
        createdAt: milestoneSummary.RecordedAt,
      });
    }

    return {
      milestones,
      nextToken: responseNextToken,
    };
  }
}

export const tokenWellArchitectedToolService =
  createInjectionToken<WellArchitectedToolPort>('WellArchitectedToolService', {
    useClass: WellArchitectedToolService,
  });

export const tokenWellArchitectedClientConstructor = createInjectionToken<
  WellArchitectedClient['constructor']
>('WellArchitectedClientConstructor', {
  useFactory: () => {
    return (...args: [] | [WellArchitectedClientConfig]) =>
      new WellArchitectedClient(...args);
  },
});

export const tokenSTSClient = createInjectionToken<STSClient>('STSClient', {
  useClass: STSClient,
});
