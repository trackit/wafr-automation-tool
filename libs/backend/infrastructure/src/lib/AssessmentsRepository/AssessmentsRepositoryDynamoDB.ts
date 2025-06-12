import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import type {
  Assessment,
  AssessmentBody,
  BestPractice,
  BestPracticeBody,
  DynamoDBAssessment,
  DynamoDBBestPractice,
  DynamoDBFinding,
  DynamoDBPillar,
  DynamoDBQuestion,
  Finding,
  FindingBody,
  Pillar,
  PillarBody,
  Question,
  User,
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
  FindingNotFoundError,
  InvalidNextTokenError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../Errors';
import { tokenLogger } from '../Logger';
import { tokenDynamoDBDocument } from '../config/dynamodb/config';

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

  private toDynamoDBBestPracticeItem(
    bestPractice: BestPractice
  ): DynamoDBBestPractice {
    return {
      description: bestPractice.description,
      id: bestPractice.id,
      label: bestPractice.label,
      primary_id: bestPractice.primaryId,
      results: bestPractice.results,
      risk: bestPractice.risk,
      checked: bestPractice.checked,
    };
  }

  private toDynamoDBQuestionItem(question: Question): DynamoDBQuestion {
    return {
      best_practices: question.bestPractices.reduce(
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
      primary_id: question.primaryId,
    };
  }

  private toDynamoDBPillarItem(pillar: Pillar): DynamoDBPillar {
    return {
      disabled: pillar.disabled,
      id: pillar.id,
      label: pillar.label,
      primary_id: pillar.primaryId,
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
      created_at: assessment.createdAt.toISOString(),
      created_by: assessment.createdBy,
      execution_arn: assessment.executionArn,
      findings: assessment.findings?.reduce(
        (pillars, pillar) => ({
          ...pillars,
          [pillar.id]: this.toDynamoDBPillarItem(pillar),
        }),
        {}
      ),
      ...(assessment.graphDatas && {
        graph_datas: {
          findings: assessment.graphDatas.findings,
          regions: assessment.graphDatas.regions,
          resource_types: assessment.graphDatas.resourceTypes,
          severities: assessment.graphDatas.severities,
        },
      }),
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      question_version: assessment.questionVersion,
      raw_graph_datas: Object.entries(assessment.rawGraphDatas).reduce(
        (rawGraphDatas, [key, value]) => ({
          ...rawGraphDatas,
          [key]: {
            findings: value.findings,
            regions: value.regions,
            resource_types: value.resourceTypes,
            severities: value.severities,
          },
        }),
        {}
      ),
      regions: assessment.regions,
      role_arn: assessment.roleArn,
      step: assessment.step,
      workflows: assessment.workflows,
      ...(assessment.error && {
        error: {
          Cause: assessment.error.cause,
          Error: assessment.error.error,
        },
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
      best_practices: finding.bestPractices,
      hidden: finding.hidden,
      id: finding.id,
      is_ai_associated: finding.isAiAssociated,
      metadata: { event_code: finding.metadata.eventCode },
      ...(finding.remediation && {
        remediation: {
          desc: finding.remediation.desc,
          references: finding.remediation.references,
        },
      }),
      resources: finding.resources?.map((resource) => ({
        name: resource.name,
        region: resource.region,
        type: resource.type,
        uid: resource.uid,
      })),
      risk_details: finding.riskDetails,
      severity: finding.severity,
      status_code: finding.statusCode,
      status_detail: finding.statusDetail,
    };
  }

  private fromDynamoDBBestPracticeItem(
    item: DynamoDBBestPractice
  ): BestPractice {
    return {
      description: item.description,
      id: item.id,
      label: item.label,
      primaryId: item.primary_id,
      results: item.results,
      risk: item.risk,
      checked: item.checked,
    };
  }

  private fromDynamoDBQuestionItem(item: DynamoDBQuestion): Question {
    return {
      bestPractices: Object.values(item.best_practices).map((bestPractice) =>
        this.fromDynamoDBBestPracticeItem(bestPractice)
      ),
      disabled: item.disabled,
      id: item.id,
      label: item.label,
      none: item.none,
      primaryId: item.primary_id,
    };
  }

  private fromDynamoDBPillarItem(item: DynamoDBPillar): Pillar {
    return {
      disabled: item.disabled,
      id: item.id,
      label: item.label,
      primaryId: item.primary_id,
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
      createdAt: new Date(assessment.created_at),
      createdBy: assessment.created_by,
      executionArn: assessment.execution_arn,
      ...(assessment.findings && {
        findings: Object.values(assessment.findings).map((pillar) =>
          this.fromDynamoDBPillarItem(pillar)
        ),
      }),
      ...(assessment.graph_datas && {
        graphDatas: {
          findings: assessment.graph_datas.findings,
          regions: assessment.graph_datas.regions,
          resourceTypes: assessment.graph_datas.resource_types,
          severities: assessment.graph_datas.severities,
        },
      }),
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      questionVersion: assessment.question_version,
      rawGraphDatas: Object.entries(assessment.raw_graph_datas).reduce(
        (rawGraphDatas, [key, value]) => ({
          ...rawGraphDatas,
          [key]: {
            findings: value.findings,
            regions: value.regions,
            resourceTypes: value.resource_types,
            severities: value.severities,
          },
        }),
        {}
      ),
      regions: assessment.regions,
      roleArn: assessment.role_arn,
      step: assessment.step,
      workflows: assessment.workflows,
      ...(assessment.error && {
        error: {
          cause: assessment.error.Cause,
          error: assessment.error.Error,
        },
      }),
    };
  }

  private fromDynamoDBFindingItem(
    item: DynamoDBFinding | undefined
  ): Finding | undefined {
    if (!item) return undefined;
    const finding = item;
    return {
      bestPractices: finding.best_practices,
      hidden: finding.hidden,
      id: finding.SK,
      isAiAssociated: finding.is_ai_associated,
      metadata: { eventCode: finding.metadata.event_code },
      ...(finding.remediation && {
        remediation: {
          desc: finding.remediation.desc,
          references: finding.remediation.references,
        },
      }),
      resources: finding.resources?.map((resource) => ({
        name: resource.name,
        region: resource.region,
        type: resource.type,
        uid: resource.uid,
      })),
      riskDetails: finding.risk_details,
      severity: finding.severity,
      statusCode: finding.status_code,
      statusDetail: finding.status_detail,
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
      params.FilterExpression = `contains(#name, :name) OR begins_with(#id, :id) OR contains(#role_arn, :role_arn)`;
      params.ExpressionAttributeNames = {
        '#name': 'name',
        '#id': 'id',
        '#role_arn': 'role_arn',
      };
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':name': search,
        ':id': search,
        ':role_arn': search,
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
        'contains(best_practices, :bestPraticeId)',
        ...(!showHidden ? ['#hidden = :hiddenValue'] : []),
        ...(searchTerm
          ? [
              'contains(risk_details, :searchTerm) or contains(status_detail, :searchTerm)',
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

  public assertBestPracticeExists(args: {
    assessment: Assessment;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): void {
    const { assessment, pillarId, questionId, bestPracticeId } = args;
    const pillar = assessment.findings?.find(
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
          'findings.#pillar.questions.#question.best_practices.#best_practice',
        DefaultExpressionAttributeNames: {
          '#pillar': pillarId,
          '#question': questionId,
          '#best_practice': bestPracticeId,
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

  public assertPillarExist(args: {
    assessment: Assessment;
    pillarId: Pillar['id'];
  }): void {
    const { assessment, pillarId } = args;
    const pillar = assessment.findings?.find(
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
    assessmentId: Assessment['id'];
    organization: User['organizationDomain'];
    pillarId: Pillar['id'];
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

    this.assertPillarExist({
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
        data: { ...pillarBody },
        UpdateExpressionPath: 'findings.#pillar',
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
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;
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
        data: assessmentBody as Record<string, unknown>,
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
        data: findingBody as Record<string, unknown>,
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
