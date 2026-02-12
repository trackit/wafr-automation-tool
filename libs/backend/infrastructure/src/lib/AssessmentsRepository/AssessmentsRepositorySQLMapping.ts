import {
  type Assessment,
  type AssessmentFileExport,
  type AssessmentVersion,
  type BestPractice,
  type BillingInformation,
  type Pillar,
  type Question,
} from '@backend/models';

import {
  type AssessmentEntity,
  type AssessmentVersionEntity,
  type BestPracticeEntity,
  type BillingInformationEntity,
  type FileExportEntity,
  type PillarEntity,
  type QuestionEntity,
} from '../config/typeorm';

export function toDomainBestPractice(e: BestPracticeEntity): BestPractice {
  return {
    id: e.id,
    description: e.description,
    label: e.label,
    primaryId: e.primaryId,
    risk: e.risk,
    checked: e.checked,
  };
}

export function toDomainQuestion(e: QuestionEntity): Question {
  return {
    id: e.id,
    disabled: e.disabled,
    label: e.label,
    none: e.none,
    primaryId: e.primaryId,
    bestPractices: e.bestPractices.map((bp) => toDomainBestPractice(bp)),
  };
}

export function toDomainPillar(e: PillarEntity): Pillar {
  return {
    id: e.id,
    disabled: e.disabled,
    label: e.label,
    primaryId: e.primaryId,
    questions: e.questions.map((q) => toDomainQuestion(q)),
  };
}

function toDomainFileExport(e: FileExportEntity): AssessmentFileExport {
  return {
    id: e.id,
    status: e.status,
    type: e.type,
    error: e.error ?? undefined,
    versionName: e.versionName,
    objectKey: e.objectKey ?? undefined,
    createdAt: e.createdAt,
  };
}

export function toDomainAssessmentVersion(
  entity: AssessmentVersionEntity,
): AssessmentVersion {
  return {
    assessmentId: entity.assessmentId,
    version: entity.version,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt,
    executionArn: entity.executionArn ?? '',
    finishedAt: entity.finishedAt ?? undefined,
    error: entity.error ?? undefined,
    wafrWorkloadArn: entity.wafrWorkloadArn ?? undefined,
    exportRegion: entity.exportRegion ?? undefined,
    pillars: (entity.pillars ?? []).map((p) => toDomainPillar(p)),
  };
}

export function toDomainBillingInformation(
  entity?: BillingInformationEntity | null,
): BillingInformation | undefined {
  if (!entity) return undefined;
  return {
    billingPeriodStartDate: entity.billingPeriodStartDate,
    billingPeriodEndDate: entity.billingPeriodEndDate,
    totalCost: entity.totalCost,
    servicesCost: entity.servicesCost ?? [],
  };
}

export function toDomainAssessmentWithVersion(
  assessment: AssessmentEntity,
  version: AssessmentVersionEntity,
  organizationDomain: string,
): Assessment {
  return {
    id: assessment.id,
    name: assessment.name,
    organization: organizationDomain,
    questionVersion: assessment.questionVersion,
    regions: assessment.regions,
    roleArn: assessment.roleArn,
    workflows: assessment.workflows,
    fileExports: (assessment.fileExports ?? []).map((fe) =>
      toDomainFileExport(fe),
    ),
    ...(assessment.opportunityId && {
      opportunityId: assessment.opportunityId,
    }),
    ...(assessment.opportunityCreatedAt && {
      opportunityCreatedAt: assessment.opportunityCreatedAt,
    }),
    latestVersionNumber: assessment.latestVersionNumber,
    ...(assessment.billingInformation && {
      billingInformation: toDomainBillingInformation(
        assessment.billingInformation,
      ),
    }),
    createdAt: assessment.createdAt,
    createdBy: version.createdBy,
    executionArn: version.executionArn ?? '',
    ...(version.finishedAt && { finishedAt: version.finishedAt }),
    ...(version.error && { error: version.error }),
    ...(version.exportRegion && { exportRegion: version.exportRegion }),
    ...(version.wafrWorkloadArn && {
      wafrWorkloadArn: version.wafrWorkloadArn,
    }),
    pillars: (version.pillars ?? []).map((p) => toDomainPillar(p)),
  };
}

export function mergeAssessmentWithVersion(
  assessment: Assessment,
  version: AssessmentVersion,
): Assessment {
  return {
    ...assessment,
    createdBy: version.createdBy ?? assessment.createdBy,
    executionArn: version.executionArn ?? assessment.executionArn,
    pillars: version.pillars ?? assessment.pillars,
    finishedAt: version.finishedAt ?? assessment.finishedAt,
    error: version.error ?? assessment.error,
    wafrWorkloadArn: version.wafrWorkloadArn ?? assessment.wafrWorkloadArn,
    exportRegion: version.exportRegion ?? assessment.exportRegion,
  };
}
