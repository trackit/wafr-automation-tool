import { QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

import type {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExportType,
  AssessmentGraphData,
  BestPracticeBody,
  PillarBody,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import { AssessmentsRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import {
  buildUpdateExpression,
  chunk,
  decodeNextToken,
  encodeNextToken,
  getAssessmentPK,
  getAssessmentSK,
} from '@shared/utils';

import {
  tokenDynamoDBAssessmentBatchSize,
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBDocument,
} from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';
import {
  fromDynamoDBAssessmentItem,
  toDynamoDBAssessmentBody,
  toDynamoDBAssessmentItem,
  toDynamoDBFileExportItem,
} from './AssessmentsRepositoryDynamoDBMapping';
import { DynamoDBAssessment } from './AssessmentsRepositoryDynamoDBModels';

export class AssessmentsRepositoryDynamoDB implements AssessmentsRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBAssessmentTableName);
  private readonly batchSize = inject(tokenDynamoDBAssessmentBatchSize);

  public async save(assessment: Assessment): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: toDynamoDBAssessmentItem(assessment),
    };

    await this.client.put(params);
    this.logger.info(`Assessment saved: ${assessment.id}`);
  }

  public async saveBestPracticesFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    bestPracticesFindings: {
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
      findingIds: Set<string>;
    }[];
  }) {
    const { assessmentId, organizationDomain, bestPracticesFindings } = args;

    const batchBestPracticesFindings = chunk(
      bestPracticesFindings,
      this.batchSize,
    );

    for (const bestPracticesFindingsItem of batchBestPracticesFindings) {
      let updateExpression = 'ADD';
      let index = 0;
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      for (const bestPracticesFinding of bestPracticesFindingsItem) {
        const { pillarId, questionId, bestPracticeId, findingIds } =
          bestPracticesFinding;

        updateExpression += ` pillars.#pillars${index}.questions.#questions${index}.bestPractices.#bestPractices${index}.results :newFindings${index},`;
        expressionAttributeNames[`#pillars${index}`] = pillarId;
        expressionAttributeNames[`#questions${index}`] = questionId;
        expressionAttributeNames[`#bestPractices${index}`] = bestPracticeId;
        expressionAttributeValues[`:newFindings${index}`] = findingIds;
        index++;
      }

      updateExpression = updateExpression.slice(0, -1);

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          PK: getAssessmentPK(organizationDomain),
          SK: getAssessmentSK(assessmentId),
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      };

      await this.client.update(params);
      this.logger.info(
        `Best practice findings updated successfully for assessment ${assessmentId}`,
      );
    }
  }

  public async saveBestPracticeFindings(args: {
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
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
      `Best practice findings updated successfully for assessment ${assessmentId}`,
    );
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
    };

    const result = await this.client.get(params);
    const dynamoAssessment = result.Item as DynamoDBAssessment | undefined;
    return fromDynamoDBAssessmentItem(dynamoAssessment);
  }

  private createGetAllQuery(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): QueryCommandInput {
    const { organizationDomain, limit, search, nextToken } = args;
    const parsedNextToken = decodeNextToken(nextToken);
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: `PK = :pk`,
      ExpressionAttributeValues: {
        ':pk': getAssessmentPK(organizationDomain),
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
    const formattedNextToken = encodeNextToken(result.LastEvaluatedKey);
    const assessments: Assessment[] =
      result.Items?.map((item) =>
        fromDynamoDBAssessmentItem(item as DynamoDBAssessment),
      ).filter((assessment): assessment is Assessment => Boolean(assessment)) ??
      [];
    return {
      assessments,
      nextToken: formattedNextToken,
    };
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
    };

    await this.client.delete(params);
    this.logger.info(`Assessment successfully deleted: ${assessmentId}`);
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
        data: toDynamoDBAssessmentBody(assessmentBody),
      }),
    };

    await this.client.update(params);
    this.logger.info(`Assessment successfully updated: ${assessmentId}`);
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
        data: pillarBody as Record<string, unknown>,
        UpdateExpressionPath: 'pillars.#pillar',
        DefaultExpressionAttributeNames: {
          '#pillar': pillarId,
        },
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `Pillar ${pillarId} updated successfully for assessment ${assessmentId}`,
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
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
      `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organizationDomain ${organizationDomain} updated successfully`,
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
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
      `Best practice ${bestPracticeId} updated successfully for assessment ${assessmentId}`,
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
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
        data: { [scanningTool]: graphData },
        UpdateExpressionPath: 'rawGraphData',
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `Raw graph data for scanning tool ${scanningTool} updated successfully for assessment ${assessmentId}`,
    );
  }

  public async updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, type, data } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      ...buildUpdateExpression({
        data: {
          [data.id]: toDynamoDBFileExportItem(data),
        },
        UpdateExpressionPath: 'fileExports.#type',
        DefaultExpressionAttributeNames: {
          '#type': type,
        },
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `${type.toUpperCase()} file with id ${
        data.id
      } export updated successfully for assessment ${assessmentId}`,
    );
  }

  public async deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    id: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, type, id } = args;

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: getAssessmentPK(organizationDomain),
        SK: getAssessmentSK(assessmentId),
      },
      UpdateExpression: `remove fileExports.#type.#id`,
      ExpressionAttributeNames: {
        '#type': type,
        '#id': id,
      },
    };

    await this.client.update(params);
    this.logger.info(
      `${type.toUpperCase()} file export with id ${id} deleted successfully for assessment ${assessmentId}`,
    );
  }
}

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('AssessmentsRepository', {
    useClass: AssessmentsRepositoryDynamoDB,
  });
