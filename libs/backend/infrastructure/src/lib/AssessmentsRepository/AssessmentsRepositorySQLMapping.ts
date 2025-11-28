import {
  type Assessment,
  type AssessmentFileExport,
  type BestPractice,
  type BillingInformation,
  type Pillar,
  type Question,
} from '@backend/models';

import {
  type AssessmentEntity,
  type BestPracticeEntity,
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

export function toDomainAssessment(
  e: AssessmentEntity,
  organizationDomain: string,
): Assessment {
  return {
    id: e.id,
    organization: organizationDomain,
    createdBy: e.createdBy,
    executionArn: e.executionArn ?? '',
    createdAt: e.createdAt,
    name: e.name,
    questionVersion: e.questionVersion,
    regions: e.regions,
    ...(e.exportRegion && { exportRegion: e.exportRegion }),
    roleArn: e.roleArn,
    ...(e.finishedAt && { finishedAt: e.finishedAt }),
    workflows: e.workflows,
    ...(e.error && { error: e.error }),
    pillars: (e.pillars ?? []).map((p) => toDomainPillar(p)),
    fileExports: (e.fileExports ?? []).map((fe) => toDomainFileExport(fe)),
    ...(e.wafrWorkloadArn && { wafrWorkloadArn: e.wafrWorkloadArn }),
    ...(e.opportunityId && { opportunityId: e.opportunityId }),
    ...(e.opportunityCreatedAt && {
      opportunityCreatedAt: e.opportunityCreatedAt,
    }),
    ...(e.billingInformation && {
      billingInformation: billingEntityToDomain(e.billingInformation),
    }),
  };
}

export function billingEntityToDomain(
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
