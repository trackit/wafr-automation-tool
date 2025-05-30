import type {
  Assessment,
  BestPractice,
  DynamoDBAssessment,
  DynamoDBBestPractice,
  DynamoDBFinding,
  DynamoDBPillar,
  DynamoDBQuestion,
  Finding,
  Pillar,
  Question,
} from '@backend/models';
import { AssessmentsRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';
import {
  tokenDynamoDBDocument,
  tokenDynamoDBBatchSize,
  tokenDynamoDBTableName,
} from '../config/dynamodb/config';

export class AssessmentsRepositoryDynamoDB implements AssessmentsRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBTableName);
  private readonly batchSize = inject(tokenDynamoDBBatchSize);

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

  private getFindingSK(args: {
    scanningTool: string;
    findingId: string;
  }): string {
    return `${args.scanningTool}#${args.findingId}`;
  }

  private toDynamoDBBestPracticeItem(
    bestPractice: BestPractice
  ): DynamoDBBestPractice {
    return {
      description: bestPractice.description,
      hidden_results: bestPractice.hiddenResults,
      id: bestPractice.id,
      label: bestPractice.label,
      primary_id: bestPractice.primaryId,
      results: bestPractice.results,
      risk: bestPractice.risk,
      status: bestPractice.status,
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
    };
  }

  private toDynamoDBFindingItem(
    finding: Finding,
    args: {
      assessmentId: string;
      organization: string;
      scanningTool: string;
    }
  ): DynamoDBFinding {
    const { assessmentId, organization, scanningTool } = args;
    return {
      PK: this.getFindingPK({ assessmentId, organization }),
      SK: this.getFindingSK({ scanningTool, findingId: finding.id }),
      best_practices: finding.bestPractices,
      hidden: finding.hidden,
      id: finding.id,
      is_ai_associated: finding.isAiAssociated,
      metadata: { event_code: finding.metadata.eventCode },
      remediation: {
        desc: finding.remediation.desc,
        references: finding.remediation.references,
      },
      resources: finding.resources.map((resource) => ({
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
      hiddenResults: item.hidden_results,
      id: item.id,
      label: item.label,
      primaryId: item.primary_id,
      results: item.results,
      risk: item.risk,
      status: item.status,
    };
  }

  private fromDynamoDBQuestionItem(item: DynamoDBQuestion): Question {
    return {
      bestPractices: Object.entries(item.best_practices).map(
        ([_, bestPractice]) => this.fromDynamoDBBestPracticeItem(bestPractice)
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
      questions: Object.entries(item.questions).map(([_, question]) =>
        this.fromDynamoDBQuestionItem(question)
      ),
    };
  }

  private fromDynamoDBAssessmentItem(
    item: DynamoDBAssessment | undefined
  ): Assessment | undefined {
    if (!item) return undefined;
    const { PK, SK, ...assessment } = item;
    return {
      createdAt: new Date(assessment.created_at),
      createdBy: assessment.created_by,
      executionArn: assessment.execution_arn,
      ...(assessment.findings && {
        findings: Object.entries(assessment.findings).map(([_, pillar]) =>
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
    };
  }

  private fromDynamoDBFindingItem(
    item: DynamoDBFinding | undefined
  ): Finding | undefined {
    if (!item) return undefined;
    const { PK, SK, ...finding } = item;
    return {
      bestPractices: finding.best_practices,
      hidden: finding.hidden,
      id: finding.id,
      isAiAssociated: finding.is_ai_associated,
      metadata: { eventCode: finding.metadata.event_code },
      remediation: {
        desc: finding.remediation.desc,
        references: finding.remediation.references,
      },
      resources: finding.resources.map((resource) => ({
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
    scanningTool: string;
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

  public async getOne(args: {
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

  public async getFinding(args: {
    assessmentId: string;
    findingId: string;
    scanningTool: string;
    organization: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organization } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.getFindingPK({ assessmentId, organization }),
        SK: this.getFindingSK({ scanningTool: args.scanningTool, findingId }),
      },
    };

    const result = await this.client.get(params);
    const dynamoFinding = result.Item as DynamoDBFinding | undefined;
    return this.fromDynamoDBFindingItem(dynamoFinding);
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    if (!(await this.getOne({ assessmentId, organization }))) {
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
    if (!(await this.getOne({ assessmentId, organization }))) {
      this.logger.error(
        `Attempted to delete findings of non-existing assessment: ${assessmentId}`
      );
      throw new Error(`Assessment with ID ${assessmentId} does not exist`);
    }

    try {
      let lastEvaluatedKey: Record<string, any> | undefined;
      const items = [];
      do {
        const result = await this.client.query({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': this.getFindingPK({ assessmentId, organization }),
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
}

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('tokenAssessmentsRepository', {
    useClass: AssessmentsRepositoryDynamoDB,
  });
