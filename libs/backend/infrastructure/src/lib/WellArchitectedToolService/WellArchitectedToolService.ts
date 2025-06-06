import {
  AnswerSummary,
  Choice,
  CreateWorkloadCommand,
  GetLensReviewCommand,
  LensReview,
  ListAnswersCommand,
  ListWorkloadsCommand,
  PillarReviewSummary,
  UpdateAnswerCommand,
  WellArchitectedClient,
  WorkloadEnvironment,
  WorkloadSummary,
} from '@aws-sdk/client-wellarchitected';

import type { WellArchitectedToolPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  Assessment,
  BestPractice,
  Pillar,
  Question,
  User,
} from '@backend/models';
import { tokenLogger } from '../Logger';

export const WAFRLens = 'wellarchitected';

export class WellArchitectedToolService implements WellArchitectedToolPort {
  private readonly client = inject(tokenWellArchitectedClient);
  private readonly logger = inject(tokenLogger);

  private async doesWorkloadExist(
    workloadName: string
  ): Promise<WorkloadSummary | null> {
    const workloads = await this.client.send(new ListWorkloadsCommand());
    const workloadSummaries = workloads.WorkloadSummaries ?? [];
    return (
      workloadSummaries.find(
        (workload) => workload.WorkloadName === workloadName
      ) || null
    );
  }

  public async createWorkload(
    assessment: Assessment,
    user: User
  ): Promise<string> {
    const workloadName = `wafr-${assessment.name.replace(' ', '-')}-${
      assessment.id
    }`;
    const workload = await this.doesWorkloadExist(workloadName);
    if (workload && workload.WorkloadId) {
      return workload.WorkloadId;
    }
    const command = new CreateWorkloadCommand({
      WorkloadName: workloadName,
      Description: `WAFR Automation Tool Assessment: ${assessment.name}`,
      Environment: WorkloadEnvironment.PRODUCTION,
      Lenses: [WAFRLens],
      AwsRegions: assessment.regions ?? ['us-west-2'],
      ReviewOwner: `WAFR Automation Tool - ${user.email}`,
      Tags: {
        Owner: user.email,
        Project: 'WAFR Automation Tool',
        Name: assessment.name,
      },
    });
    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.WorkloadId) {
      throw new Error(
        `Failed to create workload: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.WorkloadId;
  }

  public async getWorkloadLensReview(workloadId: string): Promise<LensReview> {
    const command = new GetLensReviewCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
    });
    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.LensReview) {
      throw new Error(
        `Failed to get workload lens review: ${response.$metadata.httpStatusCode}`
      );
    }
    return response.LensReview;
  }

  public async listWorkloadPillarAnswers(
    workloadId: string,
    pillarId: string
  ): Promise<AnswerSummary[]> {
    const command = new ListAnswersCommand({
      WorkloadId: workloadId,
      LensAlias: WAFRLens,
      PillarId: pillarId,
      MaxResults: 50,
    });
    const response = await this.client.send(command);
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

  public async updateWorkloadAnswer(
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
    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to update workload answer: ${response.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(`Updated Workload answer for ${questionId}`);
  }

  public async getSelectedBestPracticeList(
    answerChoiceList: Choice[],
    questionBestPracticeList: BestPractice[]
  ): Promise<string[]> {
    const selectedBestPracticeList: string[] = [];
    for (const bestPractice of answerChoiceList) {
      const { ChoiceId: bestPracticeId, Title: bestPracticeTitle } =
        bestPractice;
      if (!bestPracticeId || !bestPracticeTitle) {
        throw new Error(
          `Workflow pillar question best practice ${bestPracticeId} has no ChoiceId or Title`
        );
      }
      const bestPracticeData = questionBestPracticeList.find(
        (bestPractice) =>
          bestPractice.label.toLowerCase() === bestPracticeTitle.toLowerCase()
      );
      if (!bestPracticeData) {
        throw new Error(
          `Workflow pillar question best practice ${bestPracticeId} does not exist in assessment pillars`
        );
      }
      if (bestPracticeData.status) {
        selectedBestPracticeList.push(bestPracticeId);
      }
    }
    return selectedBestPracticeList;
  }

  public async getAnswerSelectedChoiceList(
    answerChoiceList: Choice[],
    answerQuestionData: Question
  ): Promise<string[]> {
    let selectedChoiceList: string[] = [];
    if (answerQuestionData.none) {
      const noneChoiceId = answerChoiceList.find(
        (choice) => choice.Title === 'None of these'
      )?.ChoiceId;
      if (noneChoiceId) {
        selectedChoiceList.push(noneChoiceId);
      }
    } else {
      selectedChoiceList = await this.getSelectedBestPracticeList(
        answerChoiceList,
        answerQuestionData.bestPractices
      );
    }
    return selectedChoiceList;
  }

  public async exportAnswerList(
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
        (answer) =>
          answer.label.toLowerCase() === answerQuestionTitle.toLowerCase()
      );
      if (!answerQuestionData) {
        throw new Error(
          `Workflow pillar question ${answerQuestionId} does not exist in assessment pillars`
        );
      }
      const answerSelectedChoiceList = await this.getAnswerSelectedChoiceList(
        answerChoiceList,
        answerQuestionData
      );
      await this.updateWorkloadAnswer(
        workloadId,
        answerQuestionId,
        answerSelectedChoiceList,
        answerQuestionData
      );
    }
  }

  public async exportPillarList(
    workloadId: string,
    assessmentPillarList: Pillar[],
    workflowPillarList: PillarReviewSummary[]
  ): Promise<void> {
    for (const pillar of workflowPillarList) {
      const { PillarId: pillarId, PillarName: pillarName } = pillar;
      if (!pillarId || !pillarName) {
        throw new Error(
          `Workflow pillar ${pillarId} has no PillarId or PillarName`
        );
      }
      const pillarData = assessmentPillarList.find(
        (pillar) => pillar.label.toLowerCase() === pillarName.toLowerCase()
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
        workloadId,
        pillarId
      );
      const pillarQuestionList = pillarData.questions;
      await this.exportAnswerList(
        workloadId,
        pillarAnswerList,
        pillarQuestionList
      );
    }
  }

  public async exportAssessment(
    assessment: Assessment,
    user: User
  ): Promise<void> {
    const assessmentPillarList = assessment.findings ?? [];
    const workloadId = await this.createWorkload(assessment, user);
    const workflowLensReview = await this.getWorkloadLensReview(workloadId);
    const workflowPillarList = workflowLensReview.PillarReviewSummaries ?? [];
    await this.exportPillarList(
      workloadId,
      assessmentPillarList,
      workflowPillarList
    );
  }
}

export const tokenWellArchitectedToolService =
  createInjectionToken<WellArchitectedToolPort>('WellArchitectedToolService', {
    useClass: WellArchitectedToolService,
  });

export const tokenWellArchitectedClient =
  createInjectionToken<WellArchitectedClient>('WellArchitectedClient', {
    useClass: WellArchitectedClient,
  });
