import { QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

import type {
  Assessment,
  AssessmentBody,
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

import { tokenDynamoDBDocument } from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';
import {
  DynamoDBAssessment,
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
    organizationDomain: string;
  }): string {
    return `${args.organizationDomain}#${args.assessmentId}#FINDINGS`;
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
    };
  }

  private toDynamoDBFindingItem(
    finding: Finding,
    args: {
      assessmentId: string;
      organizationDomain: string;
    }
  ): DynamoDBFinding {
    const { assessmentId, organizationDomain } = args;
    return {
      PK: this.getFindingPK({
        assessmentId,
        organizationDomain,
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
    return JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
  }

  public async save(assessment: Assessment): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: this.toDynamoDBAssessmentItem(assessment),
    };

    await this.client.put(params);
    this.logger.info(`Assessment saved: ${assessment.id}`);
  }

  public async saveFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, finding } = args;
    const params = {
      TableName: this.tableName,
      Item: this.toDynamoDBFindingItem(finding, args),
    };

    await this.client.put(params);
    this.logger.info(
      `Finding saved: ${finding.id} for assessment: ${assessmentId}`
    );
  }

  private createGetAllQuery(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): QueryCommandInput {
    const { organizationDomain, limit, search, nextToken } = args;
    const parsedNextToken =
      AssessmentsRepositoryDynamoDB.decodeNextToken(nextToken);
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: `PK = :pk`,
      ExpressionAttributeValues: {
        ':pk': this.getAssessmentPK(organizationDomain),
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
    organizationDomain: string;
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
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
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
      organizationDomain,
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
        ':pk': this.getFindingPK({ assessmentId, organizationDomain }),
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
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
    } = args;
    const params = this.buildGetBestPracticeFindingsQuery({
      assessmentId,
      organizationDomain,
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

  public async getFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, organizationDomain, findingId } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({
          assessmentId,
          organizationDomain,
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
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }) {
    const { assessmentId, organizationDomain, findingId, comment } = args;

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organizationDomain }),
        SK: findingId,
      },
      ...this.buildUpdateExpression({
        data: { [`${comment.id}`]: this.toDynamoDBFindingComment(comment) },
        UpdateExpressionPath: 'comments',
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `Comment added to finding: ${findingId} for assessment: ${assessmentId}`
    );
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }) {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
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

    await this.client.update(params);
    this.logger.info(
      `Best practice ${bestPracticeId} updated successfully for assessment ${assessmentId}`
    );
  }

  public async addBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }) {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeFindingIds,
    } = args;

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
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

    await this.client.update(params);
    this.logger.info(
      `Best practice findings updated successfully for assessment ${assessmentId}`
    );
  }

  public async updatePillar(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    pillarBody: PillarBody;
  }) {
    const { assessmentId, organizationDomain, pillarId, pillarBody } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
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

    await this.client.update(params);
    this.logger.info(
      `Pillar ${pillarId} updated successfully for assessment ${assessmentId}`
    );
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
        SK: this.getAssessmentSK(assessmentId),
      },
    };

    await this.client.delete(params);
    this.logger.info(`Assessment successfully deleted: ${assessmentId}`);
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;

    let lastEvaluatedKey: Record<string, unknown> | undefined;
    const items = [];
    do {
      const result = await this.client.query({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': this.getFindingPK({
            assessmentId,
            organizationDomain,
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
  }

  public async deleteFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, commentId } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organizationDomain }),
        SK: findingId,
      },
      UpdateExpression: `remove comments.#commentId`,
      ExpressionAttributeNames: {
        '#commentId': commentId,
      },
    };

    await this.client.update(params);
    this.logger.info(
      `Comment successfully deleted: ${commentId} for finding: ${findingId} in assessment: ${assessmentId}`
    );
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
    for (const [key, value] of Object.entries(data)) {
      const attributeName = `#${key.replace(/-/g, '_')}`;
      const attributeValue = `:${key.replace(/-/g, '_')}`;
      updateExpressions.push(
        `${args.UpdateExpressionPath ?? ''}${attributeName} = ${attributeValue}`
      );
      expressionAttributeValues[attributeValue] = value;
      expressionAttributeNames[attributeName] = key;
    }
    return {
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    };
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, assessmentBody } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: this.toDynamoDBAssessmentBody(assessmentBody),
      }),
    };

    await this.client.update(params);
    this.logger.info(`Assessment successfully updated: ${assessmentId}`);
  }

  public async updateFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, findingBody } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organizationDomain }),
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

    await this.client.update(params);
    this.logger.info(
      `Finding  successfully updated: ${findingId} for assessment: ${assessmentId}`
    );
  }

  public async updateFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }) {
    const {
      assessmentId,
      organizationDomain,
      findingId,
      commentId,
      commentBody,
    } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({
          assessmentId,
          organizationDomain,
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

    await this.client.update(params);
    this.logger.info(
      `Comment ${commentId} in finding ${findingId} for assessment ${assessmentId} updated successfully`
    );
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      questionBody,
    } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
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

    await this.client.update(params);
    this.logger.info(
      `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organizationDomain ${organizationDomain} updated successfully`
    );
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organizationDomain, scanningTool, graphData } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getAssessmentPK(organizationDomain),
        SK: this.getAssessmentSK(assessmentId),
      },
      ...this.buildUpdateExpression({
        data: { [scanningTool]: graphData },
        UpdateExpressionPath: 'rawGraphData',
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `Raw graph data for scanning tool ${scanningTool} updated successfully for assessment ${assessmentId}`
    );
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
