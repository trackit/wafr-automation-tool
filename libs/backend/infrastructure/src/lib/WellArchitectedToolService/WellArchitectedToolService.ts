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
  WellArchitectedClientConfig,
  WorkloadEnvironment,
  WorkloadSummary,
  CreateMilestoneCommand,
} from '@aws-sdk/client-wellarchitected';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

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
  private readonly stsClient = inject(tokenSTSClient);
  private readonly logger = inject(tokenLogger);
  private readonly wellArchitectedClientConstructor = inject(
    tokenWellArchitectedClientConstructor
  );

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
      throw new Error('Failed to assume role');
    }
    return this.wellArchitectedClientConstructor({
      credentials: {
        accessKeyId: credentials.Credentials.AccessKeyId!,
        secretAccessKey: credentials.Credentials.SecretAccessKey!,
        sessionToken: credentials.Credentials.SessionToken!,
      },
      region,
    });
  }

  private async getWorkloadSummary(
    wellArchitectedClient: WellArchitectedClient,
    workloadName: string
  ): Promise<WorkloadSummary | null> {
    const workloads = await wellArchitectedClient.send(
      new ListWorkloadsCommand()
    );
    const workloadSummaries = workloads.WorkloadSummaries ?? [];
    return (
      workloadSummaries.find(
        (workload) => workload.WorkloadName === workloadName
      ) || null
    );
  }

  public async createWorkload(
    wellArchitectedClient: WellArchitectedClient,
    assessment: Assessment,
    user: User
  ): Promise<string> {
    const workloadName = `wafr-${assessment.name.replace(' ', '-')}-${
      assessment.id
    }`;
    const workload = await this.getWorkloadSummary(
      wellArchitectedClient,
      workloadName
    );
    if (workload && workload.WorkloadId) {
      return workload.WorkloadId;
    }
    const command = new CreateWorkloadCommand({
      WorkloadName: workloadName,
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
  ): Promise<LensReview> {
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

  public async getSelectedBestPracticeList(
    answerChoiceList: Choice[],
    questionBestPracticeList: BestPractice[]
  ): Promise<string[]> {
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

  public async getAnswerSelectedChoiceList(
    answerChoiceList: Choice[],
    answerQuestionData: Question
  ): Promise<string[]> {
    const noneChoiceId = answerChoiceList.find(
      (choice) => choice.Title === 'None of these'
    )?.ChoiceId;
    if (answerQuestionData.none && noneChoiceId) {
      return [noneChoiceId];
    }
    const filteredChoices = noneChoiceId
      ? answerChoiceList.filter((choice) => choice.ChoiceId !== noneChoiceId)
      : answerChoiceList;
    return await this.getSelectedBestPracticeList(
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
      const answerSelectedChoiceList = await this.getAnswerSelectedChoiceList(
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
    const workloadPillarList = workloadLensReview.PillarReviewSummaries ?? [];
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
