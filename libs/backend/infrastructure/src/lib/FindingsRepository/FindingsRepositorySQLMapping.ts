import {
  type Finding,
  type FindingComment,
  type FindingRemediation,
  type FindingResource,
} from '@backend/models';

import { toDomainBestPractice } from '../AssessmentsRepository/AssessmentsRepositorySQLMapping';
import {
  type BestPracticeEntity,
  type FindingCommentEntity,
  type FindingEntity,
  type FindingRemediationEntity,
  type FindingResourceEntity,
} from '../config/typeorm';

export function toDomainFindingComment(
  e: FindingCommentEntity,
): FindingComment {
  return {
    id: e.id,
    authorId: e.authorId,
    text: e.text,
    createdAt: e.createdAt,
  };
}

export function toDomainFindingResource(
  e: FindingResourceEntity,
): FindingResource {
  return {
    name: e.name,
    region: e.region,
    type: e.type,
    uid: e.uid,
  };
}

export function toDomainFindingRemediation(
  e: FindingRemediationEntity,
): FindingRemediation {
  return {
    desc: e.desc,
    references: e.references,
  };
}

export function toDomainFinding(e: FindingEntity): Finding {
  return {
    id: e.id,
    hidden: e.hidden,
    isAIAssociated: e.isAIAssociated,
    bestPractices: (e.bestPractices ?? []).map((bp: BestPracticeEntity) =>
      toDomainBestPractice(bp),
    ),
    ...(e.eventCode && {
      eventCode: e.eventCode,
    }),
    remediation: e.remediation
      ? toDomainFindingRemediation(e.remediation)
      : undefined,
    resources: (e.resources ?? []).map((r) => toDomainFindingResource(r)),
    riskDetails: e.riskDetails,
    severity: e.severity,
    statusCode: e.statusCode,
    statusDetail: e.statusDetail,
    comments: (e.comments ?? []).map((c) => toDomainFindingComment(c)),
  };
}
