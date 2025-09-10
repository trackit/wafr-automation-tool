import { QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

import type { Finding, FindingBody, FindingComment, FindingCommentBody } from '@backend/models';
import {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import {
  buildUpdateExpression,
  decodeNextToken,
  encodeNextToken,
  getBestPracticeCustomId,
  getFindingPK,
} from '@shared/utils';

import {
  tokenDynamoDBAssessmentBatchSize,
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBDocument,
} from '../config/dynamodb/config';
import { tokenLogger } from '../Logger';
import {
  fromDynamoDBFindingItem,
  toDynamoDBFindingComment,
  toDynamoDBFindingItem,
} from './FindingsRepositoryDynamoDBMapping';
import { DynamoDBFinding } from './FindingsRepositoryDynamoDBModels';

export class FindingsRepositoryDynamoDB implements FindingRepository {
  private readonly client = inject(tokenDynamoDBDocument);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBAssessmentTableName);
  private readonly batchSize = inject(tokenDynamoDBAssessmentBatchSize);

  public async save(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, finding } = args;
    const params = {
      TableName: this.tableName,
      Item: toDynamoDBFindingItem(finding, args),
    };

    await this.client.put(params);
    this.logger.info(
      `Finding saved: ${finding.id} for assessment: ${assessmentId}`
    );
  }

  public async saveComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }) {
    const { assessmentId, organizationDomain, findingId, comment } = args;

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: getFindingPK({ assessmentId, organizationDomain }),
        SK: findingId,
      },
      ...buildUpdateExpression({
        data: { [`${comment.id}`]: toDynamoDBFindingComment(comment) },
        UpdateExpressionPath: 'comments',
      }),
    };

    await this.client.update(params);
    this.logger.info(
      `Comment added to finding: ${findingId} for assessment: ${assessmentId}`
    );
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, organizationDomain, findingId } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: getFindingPK({
          assessmentId,
          organizationDomain,
        }),
        SK: findingId,
      },
    };

    const result = await this.client.get(params);
    const dynamoFinding = result.Item as DynamoDBFinding | undefined;
    this.logger.info(
      `Finding get: ${findingId} for assessment: ${assessmentId}`
    );
    return fromDynamoDBFindingItem(dynamoFinding);
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
        ':pk': getFindingPK({ assessmentId, organizationDomain }),
        ':bestPraticeId': getBestPracticeCustomId({
          pillarId,
          questionId,
          bestPracticeId,
        }),
        ...(!showHidden && { ':hiddenValue': false }),
        ...(searchTerm && { ':searchTerm': searchTerm }),
      },
      ...(!showHidden && {
        ExpressionAttributeNames: { '#hidden': 'hidden' },
      }),
      Limit: limit,
      ExclusiveStartKey: decodeNextToken(nextToken),
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
    this.logger.info(
      `Findings best practices get: ${assessmentId} for organizationDomain: ${organizationDomain} with pillarId: ${pillarId} and questionId: ${questionId} and bestPracticeId: ${bestPracticeId}`
    );
    return {
      findings: items.map((item) => fromDynamoDBFindingItem(item) as Finding),
      nextToken: encodeNextToken(params.ExclusiveStartKey),
    };
  }

  public async deleteAll(args: {
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
          ':pk': getFindingPK({
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

  public async deleteComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, commentId } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: getFindingPK({ assessmentId, organizationDomain }),
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

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, findingBody } = args;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: getFindingPK({ assessmentId, organizationDomain }),
        SK: findingId,
      },
      ...buildUpdateExpression({
        data: {
          ...findingBody,
          ...(findingBody.comments && {
            comments: Object.fromEntries(
              findingBody.comments.map((comment) => [
                comment.id,
                toDynamoDBFindingComment(comment),
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

  public async updateComment(args: {
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
        PK: getFindingPK({
          assessmentId,
          organizationDomain,
        }),
        SK: findingId,
      },
      ...buildUpdateExpression({
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
}

export const tokenFindingsRepository = createInjectionToken<FindingRepository>(
  'FindingRepository',
  {
    useClass: FindingsRepositoryDynamoDB,
  }
);
