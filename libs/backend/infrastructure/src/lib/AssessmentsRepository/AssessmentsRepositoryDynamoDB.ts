import { QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

import type {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExports,
  AssessmentFileExportType,
  AssessmentGraphData,
  BestPractice,
  BestPracticeBody,
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
  Pillar,
  PillarBody,
  Question,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import {
  AssessmentsRepository,
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
  FileExportNotFoundError,
  FindingNotFoundError,
  InvalidNextTokenError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../Errors';
import { tokenDynamoDBDocument } from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';
import {
  DynamoDBAssessment,
  DynamoDBAssessmentFileExport,
  DynamoDBAssessmentFileExports,
  DynamoDBFinding,
  DynamoDBFindingComment,
  DynamoDBPillar,
  DynamoDBQuestion,
} from './AssessmentsRepositoryDynamoDBModels';

export class AssessmentsRepositoryDynamoDB implements AssessmentsRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBAssessmentTableName);
  private readonly batchSize = inject(tokenDynamoDBAssessmentBatchSize);

  private getAssessmentPK(organization: string): string {
    return organization;
  }

  private getAssessmentSK(assessmentId: string): string {
    return `ASSESSMENT#${assessmentId}`;
  }

  private getFindingPK(args: {
    assessmentId: string;
    organization: string;
  }): string {
    return `${args.organization}#${args.assessmentId}#FINDINGS`;
  }

  public static getBestPracticeCustomId(args: {
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): string {
    return `${args.pillarId}#${args.questionId}#${args.bestPracticeId}`;
  }

  private toDynamoDBBestPracticeItem(bestPractice: BestPractice): BestPractice {
    return {
      description: bestPractice.description,
      id: bestPractice.id,
      label: bestPractice.label,
      primaryId: bestPractice.primaryId,
      results:
        bestPractice.results.size > 0
          ? bestPractice.results
          : new Set<string>(['']), // Dirty hack because DynamoDB does not allow empty sets
      risk: bestPractice.risk,
      checked: bestPractice.checked,
    };
  }

  private toDynamoDBQuestionItem(question: Question): DynamoDBQuestion {
    return {
      bestPractices: question.bestPractices.reduce(
        (bestPractices, bestPractice) => ({
          ...bestPractices,
          [bestPractice.id]: this.toDynamoDBBestPracticeItem(bestPractice),
        }),
        {}
      ),
      disabled: question.disabled,
      id: question.id,
      label: question.label,
      none: question.none,
      primaryId: question.primaryId,
    };
  }

  private toDynamoDBPillarItem(pillar: Pillar): DynamoDBPillar {
    return {
      disabled: pillar.disabled,
      id: pillar.id,
      label: pillar.label,
      primaryId: pillar.primaryId,
      questions: pillar.questions.reduce(
        (questions, question) => ({
          ...questions,
          [question.id]: this.toDynamoDBQuestionItem(question),
        }),
        {}
      ),
    };
  }

  private toDynamoDBAssessmentItem(assessment: Assessment): DynamoDBAssessment {
    return {
      PK: this.getAssessmentPK(assessment.organization),
      SK: this.getAssessmentSK(assessment.id),
      createdAt: assessment.createdAt.toISOString(),
      createdBy: assessment.createdBy,
      executionArn: assessment.executionArn,
      pillars: assessment.pillars?.reduce(
        (pillars, pillar) => ({
          ...pillars,
          [pillar.id]: this.toDynamoDBPillarItem(pillar),
        }),
        {}
      ),
      graphData: assessment.graphData,
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      questionVersion: assessment.questionVersion,
      rawGraphData: assessment.rawGraphData,
      regions: assessment.regions,
      exportRegion: assessment.exportRegion,
      roleArn: assessment.roleArn,
      step: assessment.step,
      workflows: assessment.workflows,
      error: assessment.error,
      ...(assessment.fileExports && {
        fileExports: Object.fromEntries(
          Object.entries(assessment.fileExports).map(([k, v]) => [
            k,
            Object.fromEntries(
              (v as AssessmentFileExport[]).map((fileExport) => [
                fileExport.id,
                this.toDynamoDBFileExportItem(fileExport),
              ])
            ),
          ])
        ) as DynamoDBAssessmentFileExports,
      }),
    };
  }

  private toDynamoDBFileExportItem(
    assessmentFileExport: AssessmentFileExport
  ): DynamoDBAssessmentFileExport {
    return {
      ...assessmentFileExport,
      createdAt: assessmentFileExport.createdAt.toISOString(),
    };
  }

  private toDynamoDBAssessmentBody(
    assessmentBody: AssessmentBody
  ): Record<string, unknown> {
    return {
      ...assessmentBody,
      ...(assessmentBody.pillars && {
        pillars: assessmentBody.pillars.reduce(
          (pillars, pillar) => ({
            ...pillars,
            [pillar.id]: this.toDynamoDBPillarItem(pillar),
          }),
          {}
        ),
      }),
      ...(assessmentBody.fileExports && {
        fileExports: Object.fromEntries(
          Object.entries(assessmentBody.fileExports).map(([k, v]) => [
            k,
            Object.fromEntries(
              (v as AssessmentFileExport[]).map((fileExport) => [
                fileExport.id,
                this.toDynamoDBFileExportItem(fileExport),
              ])
            ),
          ])
        ),
      }),
    };
  }

  private toDynamoDBFindingItem(
    finding: Finding,
    args: {
      assessmentId: string;
      organization: string;
    }
  ): DynamoDBFinding {
    const { assessmentId, organization } = args;
    return {
      PK: this.getFindingPK({
        assessmentId,
        organization,
      }),
      SK: finding.id,
      bestPractices: finding.bestPractices,
      hidden: finding.hidden,
      id: finding.id,
      isAIAssociated: finding.isAIAssociated,
      metadata: { eventCode: finding.metadata?.eventCode },
      remediation: finding.remediation,
      resources: finding.resources,
      riskDetails: finding.riskDetails,
      severity: finding.severity,
      statusCode: finding.statusCode,
      statusDetail: finding.statusDetail,
      ...(finding.comments && {
        comments: Object.fromEntries(
          finding.comments.map((comment) => [
            comment.id,
            this.toDynamoDBFindingComment(comment),
          ])
        ),
      }),
    };
  }

  private fromDynamoDBBestPracticeItem(item: BestPractice): BestPractice {
    return {
      description: item.description,
      id: item.id,
      label: item.label,
      primaryId: item.primaryId,
      results: new Set([...item.results].filter((result) => result !== '')), // Filter out empty strings due to our dirty hack
      risk: item.risk,
      checked: item.checked,
    };
  }

  private fromDynamoDBQuestionItem(item: DynamoDBQuestion): Question {
    return {
      bestPractices: Object.values(item.bestPractices).map((bestPractice) =>
        this.fromDynamoDBBestPracticeItem(bestPractice)
      ),
      disabled: item.disabled,
      id: item.id,
      label: item.label,
      none: item.none,
      primaryId: item.primaryId,
    };
  }

  private fromDynamoDBPillarItem(item: DynamoDBPillar): Pillar {
    return {
      disabled: item.disabled,
      id: item.id,
      label: item.label,
      primaryId: item.primaryId,
      questions: Object.values(item.questions).map((question) =>
        this.fromDynamoDBQuestionItem(question)
      ),
    };
  }

  private fromDynamoDBFileExportItem(
    item: DynamoDBAssessmentFileExport
  ): AssessmentFileExport {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
    };
  }

  private fromDynamoDBAssessmentItem(
    item: DynamoDBAssessment | undefined
  ): Assessment | undefined {
    if (!item) return undefined;
    const assessment = item;
    return {
      createdAt: new Date(assessment.createdAt),
      createdBy: assessment.createdBy,
      executionArn: assessment.executionArn,
      ...(assessment.pillars && {
        pillars: Object.values(assessment.pillars).map((pillar) =>
          this.fromDynamoDBPillarItem(pillar)
        ),
      }),
      graphData: assessment.graphData,
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      questionVersion: assessment.questionVersion,
      rawGraphData: assessment.rawGraphData,
      regions: assessment.regions,
      exportRegion: assessment.exportRegion,
      roleArn: assessment.roleArn,
      step: assessment.step,
      workflows: assessment.workflows,
      error: assessment.error,
      ...(assessment.fileExports && {
        fileExports: Object.fromEntries(
          Object.entries(assessment.fileExports).map(([k, v]) => [
            k,
            Object.values(
              v as Record<string, DynamoDBAssessmentFileExport>
            ).map((item) => this.fromDynamoDBFileExportItem(item)),
          ])
        ) as AssessmentFileExports,
      }),
    };
  }

  private fromDynamoDBFindingItem(
    item: DynamoDBFinding | undefined
  ): Finding | undefined {
    if (!item) return undefined;
    const finding = item;
    return {
      bestPractices: finding.bestPractices,
      hidden: finding.hidden,
      id: finding.SK,
      isAIAssociated: finding.isAIAssociated,
      metadata: finding.metadata,
      remediation: finding.remediation,
      resources: finding.resources,
      riskDetails: finding.riskDetails,
      severity: finding.severity,
      statusCode: finding.statusCode,
      statusDetail: finding.statusDetail,
      comments: finding.comments
        ? Object.values(finding.comments).map((comment) =>
            this.fromDynamoDBFindingComment(comment)
          )
        : undefined,
    };
  }

  private toDynamoDBFindingComment(
    comment: FindingComment
  ): DynamoDBFindingComment {
    return {
      id: comment.id,
      authorId: comment.authorId,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  private fromDynamoDBFindingComment(
    comment: DynamoDBFindingComment
  ): FindingComment {
    return {
      id: comment.id,
      authorId: comment.authorId,
      text: comment.text,
      createdAt: new Date(comment.createdAt),
    };
  }

  public static encodeNextToken(
    nextToken?: Record<string, unknown>
  ): string | undefined {
    if (!nextToken) return undefined;
    return Buffer.from(JSON.stringify(nextToken)).toString('base64');
  }

  public static decodeNextToken(
    nextToken?: string
  ): Record<string, unknown> | undefined {
    if (!nextToken) return undefined;
    try {
      return JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
    } catch {
      throw new InvalidNextTokenError();
    }
  }

  public async save(assessment: Assessment): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: this.toDynamoDBAssessmentItem(assessment),
    };

    try {
      await this.client.put(params);
      this.logger.info(`Assessment saved: ${assessment.id}`);
    } catch (error) {
      this.logger.error(`Failed to save assessment: ${error}`, params);
      throw error;
    }
  }

  public async saveFinding(args: {
    assessmentId: string;
    organization: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, finding } = args;
    const params = {
      TableName: this.tableName,
      Item: this.toDynamoDBFindingItem(finding, args),
    };

    try {
      await this.client.put(params);
      this.logger.info(
        `Finding saved: ${finding.id} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to save finding: ${error}`, params);
      throw error;
    }
  }

  private createGetAllQuery(args: {
    organization: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): QueryCommandInput {
    const { organization, limit, search, nextToken } = args;
    const parsedNextToken =
      AssessmentsRepositoryDynamoDB.decodeNextToken(nextToken);
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: `PK = :pk`,
      ExpressionAttributeValues: {
        ':pk': this.getAssessmentPK(organization),
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: parsedNextToken,
    };
    if (search) {
      params.FilterExpression = `contains(#name, :name) OR begins_with(#id, :id) OR contains(#roleArn, :roleArn)`;
      params.ExpressionAttributeNames = {
        '#name': 'name',
        '#id': 'id',
        '#roleArn': 'roleArn',
      };
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':name': search,
        ':id': search,
        ':roleArn': search,
      };
    }
    return params;
  }

  public async getAll(args: {
    organization: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }> {
    const params = this.createGetAllQuery(args);
    const result = await this.client.query(params);
    const formattedNextToken = AssessmentsRepositoryDynamoDB.encodeNextToken(
      result.LastEvaluatedKey
    );
    const assessments: Assessment[] =
      result.Items?.map((item) =>
        this.fromDynamoDBAssessmentItem(item as DynamoDBAssessment)
      ).filter((assessment): assessment is Assessment => Boolean(assessment)) ??
      [];
    return {
      assessments,
      nextToken: formattedNextToken,
    };
  }

  public async get(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organization } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
    };

    const result = await this.client.get(params);
    const dynamoAssessment = result.Item as DynamoDBAssessment | undefined;
    return this.fromDynamoDBAssessmentItem(dynamoAssessment);
  }

  private buildGetBestPracticeFindingsQuery(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): QueryCommandInput {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
      searchTerm = '',
      showHidden = false,
      nextToken,
    } = args;
    return {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: [
        'contains(bestPractices, :bestPraticeId)',
        ...(!showHidden ? ['#hidden = :hiddenValue'] : []),
        ...(searchTerm
          ? [
              'contains(riskDetails, :searchTerm) or contains(statusDetail, :searchTerm)',
            ]
          : []),
      ].join(' and '),
      ExpressionAttributeValues: {
        ':pk': this.getFindingPK({ assessmentId, organization }),
        ':bestPraticeId': AssessmentsRepositoryDynamoDB.getBestPracticeCustomId(
          {
            pillarId,
            questionId,
            bestPracticeId,
          }
        ),
        ...(!showHidden && { ':hiddenValue': false }),
        ...(searchTerm && { ':searchTerm': searchTerm }),
      },
      ...(!showHidden && {
        ExpressionAttributeNames: { '#hidden': 'hidden' },
      }),
      Limit: limit,
      ExclusiveStartKey:
        AssessmentsRepositoryDynamoDB.decodeNextToken(nextToken),
    };
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{ findings: Finding[]; nextToken?: string }> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
    } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to get best practice findings for non-existing assessment ${assessmentId} in organization ${organization}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    this.assertBestPracticeExists({
      assessment,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
    });
    const params = this.buildGetBestPracticeFindingsQuery({
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      limit: args.limit,
      nextToken: args.nextToken,
      searchTerm: args.searchTerm,
      showHidden: args.showHidden,
    });
    const items = [];
    do {
      const result = await this.client.query(params);
      items.push(...((result.Items || []) as DynamoDBFinding[]));
      params.ExclusiveStartKey = result.LastEvaluatedKey;
    } while (params.ExclusiveStartKey && items.length < limit);
    return {
      findings: items.map(
        (item) => this.fromDynamoDBFindingItem(item) as Finding
      ),
      nextToken: AssessmentsRepositoryDynamoDB.encodeNextToken(
        params.ExclusiveStartKey
      ),
    };
  }

  public async getAssessmentFindings({
    assessmentId,
    organization,
  }: {
    assessmentId: string;
    organization: string;
  }): Promise<Finding[]> {
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to get all findings for non-existing assessment ${assessmentId} in organization ${organization}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': this.getFindingPK({ assessmentId, organization }),
      },
      ExclusiveStartKey: undefined,
    };
    const items = [];
    do {
      const result = await this.client.query(params);
      items.push(...((result.Items || []) as DynamoDBFinding[]));
      params.ExclusiveStartKey = result.LastEvaluatedKey;
    } while (params.ExclusiveStartKey);
    return items.map((item) => this.fromDynamoDBFindingItem(item) as Finding);
  }

  public async getFinding(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, organization, findingId } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({
          assessmentId,
          organization,
        }),
        SK: findingId,
      },
    };

    const result = await this.client.get(params);
    const dynamoFinding = result.Item as DynamoDBFinding | undefined;
    return this.fromDynamoDBFindingItem(dynamoFinding);
  }

  public async addFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    comment: FindingComment;
  }) {
    const { assessmentId, organization, findingId, comment } = args;
    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({
        assessmentId,
        organization,
        findingId,
      });
    }

    // Backward compatibility: if finding has no comments field, create an empty object
    if (!finding.comments) {
      await this.updateFinding({
        assessmentId,
        organization,
        findingId,
        findingBody: {
          comments: [],
        },
      });
    }

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organization }),
        SK: findingId,
      },
      ...this.buildUpdateExpression({
        data: { [`${comment.id}`]: this.toDynamoDBFindingComment(comment) },
        UpdateExpressionPath: 'comments',
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Comment added to finding: ${findingId} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to add comment to finding: ${error}`, params);
      throw error;
    }
  }

  public assertBestPracticeExists(args: {
    assessment: Assessment;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): void {
    const { assessment, pillarId, questionId, bestPracticeId } = args;
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (question) => question.id === questionId.toString()
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
      });
    }
    const bestPractice = question.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new BestPracticeNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }) {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update non-existing assessment best practice: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({
        assessmentId,
        organization,
      });
    }

    this.assertBestPracticeExists({
      assessment,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
    });

    if (Object.keys(bestPracticeBody).length === 0) {
      this.logger.error(
        `Nothing to update for best practice: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for best practice: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: { ...bestPracticeBody },
        UpdateExpressionPath:
          'pillars.#pillar.questions.#question.bestPractices.#bestPractice',
        DefaultExpressionAttributeNames: {
          '#pillar': pillarId,
          '#question': questionId,
          '#bestPractice': bestPracticeId,
        },
      }),
    };
    try {
      await this.client.update(params);
    } catch (error) {
      this.logger.error(`Failed to update best practice: ${error}`, params);
      throw error;
    }
  }

  public async addBestPracticeFindings(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }) {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeFindingIds,
    } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update non-existing assessment best practice: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({
        assessmentId,
        organization,
      });
    }

    this.assertBestPracticeExists({
      assessment,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
    });

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      UpdateExpression: `
        ADD pillars.#pillar.questions.#question.bestPractices.#bestPractice.results :newFindings
      `,
      ExpressionAttributeNames: {
        '#pillar': pillarId,
        '#question': questionId,
        '#bestPractice': bestPracticeId,
      },
      ExpressionAttributeValues: {
        ':newFindings': bestPracticeFindingIds,
      },
    };
    try {
      await this.client.update(params);
    } catch (error) {
      this.logger.error(
        `Failed to update best practice findings: ${error}`,
        params
      );
      throw error;
    }
  }

  public assertPillarExists(args: {
    assessment: Assessment;
    pillarId: string;
  }): void {
    const { assessment, pillarId } = args;
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
  }

  public async updatePillar(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    pillarBody: PillarBody;
  }) {
    const { assessmentId, organization, pillarId, pillarBody } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update non-existing assessment pillar: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({
        assessmentId,
        organization,
      });
    }

    this.assertPillarExists({
      assessment,
      pillarId,
    });

    if (Object.keys(pillarBody).length === 0) {
      this.logger.error(
        `Nothing to update for pillar: ${assessmentId}#${pillarId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for pillar: ${assessmentId}#${pillarId}`
      );
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: pillarBody as Record<string, unknown>,
        UpdateExpressionPath: 'pillars.#pillar',
        DefaultExpressionAttributeNames: {
          '#pillar': pillarId,
        },
      }),
    };
    try {
      await this.client.update(params);
    } catch (error) {
      this.logger.error(`Failed to update pillar: ${error}`, params);
      throw error;
    }
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    if (!(await this.get({ assessmentId, organization }))) {
      this.logger.error(
        `Attempted to delete non-existing assessment: ${assessmentId}`
      );
      throw new Error(`Assessment with ID ${assessmentId} does not exist`);
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
    };

    try {
      await this.client.delete(params);
      this.logger.info(`Assessment deleted: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete assessment: ${error}`, params);
      throw error;
    }
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    if (!(await this.get({ assessmentId, organization }))) {
      this.logger.error(
        `Attempted to delete findings of non-existing assessment: ${assessmentId}`
      );
      throw new Error(`Assessment with ID ${assessmentId} does not exist`);
    }

    try {
      let lastEvaluatedKey: Record<string, unknown> | undefined;
      const items = [];
      do {
        const result = await this.client.query({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': this.getFindingPK({
              assessmentId,
              organization,
            }),
          },
          ExclusiveStartKey: lastEvaluatedKey,
          ProjectionExpression: 'PK, SK',
        });
        items.push(...(result.Items || []));
        if (items.length === 0) return;
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      const deleteRequests = items.map((item) => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        },
      }));

      for (let i = 0; i < deleteRequests.length; i += this.batchSize) {
        const batch = deleteRequests.slice(i, i + this.batchSize);
        await this.client.batchWrite({
          RequestItems: { [this.tableName]: batch },
        });
      }

      this.logger.info(`Findings deleted for assessment: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete findings: ${error}`, args);
      throw error;
    }
  }

  public async deleteFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organization, findingId, commentId } = args;

    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({
        assessmentId,
        organization,
        findingId,
      });
    }

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organization }),
        SK: finding.id,
      },
      UpdateExpression: `REMOVE comments.#commentId`,
      ExpressionAttributeNames: {
        '#commentId': commentId,
      },
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Finding comment deleted: ${finding.id} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to delete finding comment: ${error}`, params);
      throw error;
    }
  }

  private buildUpdateExpression(args: {
    data: Record<string, unknown>;
    UpdateExpressionPath?: string;
    DefaultExpressionAttributeValues?: Record<string, unknown>;
    DefaultExpressionAttributeNames?: Record<string, string>;
  }): {
    UpdateExpression: string;
    ExpressionAttributeValues: Record<string, unknown>;
    ExpressionAttributeNames: Record<string, string>;
  } {
    const {
      data,
      DefaultExpressionAttributeValues,
      DefaultExpressionAttributeNames,
    } = args;
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> =
      DefaultExpressionAttributeValues || {};
    const expressionAttributeNames: Record<string, string> =
      DefaultExpressionAttributeNames || {};

    if (args.UpdateExpressionPath && !args.UpdateExpressionPath.endsWith('.')) {
      args.UpdateExpressionPath += '.';
    }
    let i = 0;
    for (const [key, value] of Object.entries(data)) {
      const attributeName = `#property_${i}`;
      const attributeValue = `:value_${i}`;
      updateExpressions.push(
        `${args.UpdateExpressionPath ?? ''}${attributeName} = ${attributeValue}`
      );
      expressionAttributeValues[attributeValue] = value;
      expressionAttributeNames[attributeName] = key;
      i++;
    }
    return {
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    };
  }

  public async update(args: {
    assessmentId: string;
    organization: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organization, assessmentBody } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update non-existing assessment with id ${assessmentId} and organization ${organization}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    if (Object.keys(assessmentBody).length === 0) {
      this.logger.error(
        `Nothing to update for assessment ${assessmentId} for organization ${organization}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for assessment ${assessmentId} for organization ${organization}`
      );
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: this.toDynamoDBAssessmentBody(assessmentBody),
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(`Assessment updated: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to update assessment: ${error}`, params);
      throw error;
    }
  }

  public async updateFinding(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organization, findingId, findingBody } = args;
    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({
        assessmentId,
        organization,
        findingId,
      });
    }
    if (Object.keys(findingBody).length === 0) {
      this.logger.error(
        `Nothing to update for finding ${findingId} in assessment ${assessmentId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for finding ${findingId} in assessment ${assessmentId}`
      );
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organization }),
        SK: findingId,
      },
      ...this.buildUpdateExpression({
        data: {
          ...findingBody,
          ...(findingBody.comments && {
            comments: Object.fromEntries(
              findingBody.comments.map((comment) => [
                comment.id,
                this.toDynamoDBFindingComment(comment),
              ])
            ),
          }),
        },
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Finding updated: ${findingId} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to update finding: ${error}`, params);
      throw error;
    }
  }

  public async updateFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }) {
    const { assessmentId, organization, findingId, commentId, commentBody } =
      args;

    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({
        assessmentId,
        organization,
        findingId,
      });
    }

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({
          assessmentId,
          organization,
        }),
        SK: findingId,
      },
      ...this.buildUpdateExpression({
        data: commentBody as Record<string, unknown>,
        UpdateExpressionPath: 'comments.#commentId',
        DefaultExpressionAttributeNames: {
          '#commentId': commentId,
        },
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Comment ${commentId} in finding ${findingId} for assessment ${assessmentId} updated successfully`
      );
    } catch (error) {
      this.logger.error(`Failed to update comment: ${error}`, params);
      throw error;
    }
  }

  private assertQuestionExists(args: {
    assessment: Assessment;
    organization: string;
    pillarId: string;
    questionId: string;
  }): void {
    const { assessment, pillarId, questionId } = args;
    const pillar = assessment.pillars?.find((pillar) => pillar.id === pillarId);
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (question) => question.id === questionId
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
      });
    }
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, questionId, questionBody } =
      args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update non-existing assessment question: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    this.assertQuestionExists({
      assessment,
      organization,
      pillarId,
      questionId,
    });
    if (Object.keys(questionBody).length === 0) {
      this.logger.error(
        `Nothing to update for question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization}`
      );
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: questionBody as Record<string, unknown>,
        UpdateExpressionPath: 'pillars.#pillar.questions.#question',
        DefaultExpressionAttributeNames: {
          '#pillar': pillarId,
          '#question': questionId,
        },
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization} updated successfully`
      );
    } catch (error) {
      this.logger.error(`Failed to update question: ${error}`, params);
      throw error;
    }
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organization: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organization, scanningTool, graphData } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update raw graph data for non-existing assessment: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: { [scanningTool]: graphData },
        UpdateExpressionPath: 'rawGraphData',
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `Raw graph data for scanning tool ${scanningTool} updated successfully for assessment ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to update raw graph data: ${error}`, params);
      throw error;
    }
  }

  public async updateFileExport(args: {
    assessmentId: string;
    organization: string;
    type: AssessmentFileExportType;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organization, type, data } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to update ${type.toUpperCase()} file export for non-existing assessment: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: {
          [data.id]: this.toDynamoDBFileExportItem(data),
        },
        UpdateExpressionPath: 'fileExports.#type',
        DefaultExpressionAttributeNames: {
          '#type': type,
        },
      }),
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `${type.toUpperCase()} file with id ${
          data.id
        } export updated successfully for assessment ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update ${type.toUpperCase()} file export with id ${
          data.id
        } for assessment ${assessmentId}: ${error}`,
        params
      );
      throw error;
    }
  }

  public async deleteFileExport(args: {
    assessmentId: string;
    organization: string;
    type: AssessmentFileExportType;
    id: string;
  }): Promise<void> {
    const { assessmentId, organization, type, id } = args;
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted to delete file export with id ${id} for non-existing assessment: ${assessmentId}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    if (
      !assessment.fileExports?.[type]?.find(
        (fileExport) => fileExport.id === id
      )
    ) {
      this.logger.error(
        `Attempted to delete file export with id ${id} for assessment: ${assessmentId} but it does not exist`
      );
      throw new FileExportNotFoundError({
        assessmentId,
        organization,
        type,
        id,
      });
    }
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organization),
        SK: this.getAssessmentSK(assessmentId),
      },
      UpdateExpression: `remove fileExports.#type.#id`,
      ExpressionAttributeNames: {
        '#type': type,
        '#id': id,
      },
    };
    try {
      await this.client.update(params);
      this.logger.info(
        `${type.toUpperCase()} file export with id ${id} deleted successfully for assessment ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete ${type.toUpperCase()} file export with id ${id} for assessment ${assessmentId}: ${error}`,
        params
      );
      throw error;
    }
  }
}

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('AssessmentsRepository', {
    useClass: AssessmentsRepositoryDynamoDB,
  });

export const tokenDynamoDBAssessmentTableName = createInjectionToken<string>(
  'DynamoDBAssessmentTableName',
  {
    useFactory: () => {
      const tableName = process.env.DDB_TABLE;
      assertIsDefined(tableName, 'DDB_TABLE is not defined');
      return tableName;
    },
  }
);

export const tokenDynamoDBAssessmentBatchSize = createInjectionToken<number>(
  'DynamoDBAssessmentBatchSize',
  { useValue: 25 } // Default batch size for DynamoDB operations
);
