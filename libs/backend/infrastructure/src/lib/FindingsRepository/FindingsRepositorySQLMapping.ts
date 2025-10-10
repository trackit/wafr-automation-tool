import {
  Finding,
  FindingComment,
  FindingRemediation,
  FindingResource,
} from '@backend/models';
import { getBestPracticeCustomId } from '@shared/utils';

import {
  FindingCommentEntity,
  FindingEntity,
  FindingRemediationEntity,
  FindingResourceEntity,
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
    bestPractices: e.bestPractices
      .map((bp) =>
        getBestPracticeCustomId({
          pillarId: bp.pillarId,
          questionId: bp.questionId,
          bestPracticeId: bp.id,
        }),
      )
      .join(','),
    ...(e.eventCode && {
      metadata: {
        eventCode: e.eventCode,
      },
    }),
    remediation: e.remediation
      ? toDomainFindingRemediation(e.remediation)
      : undefined,
    resources: (e.resources ?? []).map((r) => toDomainFindingResource(r)),
    riskDetails: e.riskDetails === '' ? undefined : e.riskDetails,
    severity: e.severity,
    statusCode: e.statusCode === '' ? undefined : e.statusCode,
    statusDetail: e.statusDetail === '' ? undefined : e.statusDetail,
    comments: (e.comments ?? []).map((c) => toDomainFindingComment(c)),
  };
}
