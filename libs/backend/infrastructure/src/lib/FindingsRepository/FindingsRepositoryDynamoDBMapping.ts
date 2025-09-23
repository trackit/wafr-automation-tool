import { Finding, FindingComment } from '@backend/models';
import { getFindingPK } from '@shared/utils';

import {
  DynamoDBFinding,
  DynamoDBFindingComment,
} from './FindingsRepositoryDynamoDBModels';

export function toDynamoDBFindingItem(
  finding: Finding,
  args: {
    assessmentId: string;
    organizationDomain: string;
  }
): DynamoDBFinding {
  const { assessmentId, organizationDomain } = args;
  return {
    PK: getFindingPK({
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
          toDynamoDBFindingComment(comment),
        ])
      ),
    }),
  };
}

export function fromDynamoDBFindingItem(
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
          fromDynamoDBFindingComment(comment)
        )
      : undefined,
  };
}

export function toDynamoDBFindingComment(
  comment: FindingComment
): DynamoDBFindingComment {
  return {
    id: comment.id,
    authorId: comment.authorId,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function fromDynamoDBFindingComment(
  comment: DynamoDBFindingComment
): FindingComment {
  return {
    id: comment.id,
    authorId: comment.authorId,
    text: comment.text,
    createdAt: new Date(comment.createdAt),
  };
}
