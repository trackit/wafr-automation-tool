import {
  Assessment,
  AssessmentFileExport,
  BestPractice,
  Pillar,
  Question,
} from '@backend/models';

import {
  AssessmentEntity,
  BestPracticeEntity,
  FileExportEntity,
  PillarEntity,
  QuestionEntity,
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
    bestPractices: (e.bestPractices ?? []).map((bp) =>
      toDomainBestPractice(bp)
    ),
  };
}

export function toDomainPillar(e: PillarEntity): Pillar {
  return {
    id: e.id,
    disabled: e.disabled,
    label: e.label,
    primaryId: e.primaryId,
    questions: (e.questions ?? []).map((q) => toDomainQuestion(q)),
  };
}

export function toDomainFileExport(e: FileExportEntity): AssessmentFileExport {
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
  organizationDomain: string
): Assessment {
  return {
    id: e.id,
    organization: organizationDomain,
    createdBy: e.createdBy,
    executionArn: e.executionArn,
    createdAt: e.createdAt,
    name: e.name,
    questionVersion: e.questionVersion,
    regions: e.regions ?? [],
    ...(e.exportRegion && { exportRegion: e.exportRegion }),
    roleArn: e.roleArn,
    finished: e.finished,
    workflows: e.workflows ?? [],
    ...(e.error && { error: e.error }),
    pillars: (e.pillars ?? []).map((p) => toDomainPillar(p)),
    fileExports: (e.fileExports ?? []).map((fileExport) =>
      toDomainFileExport(fileExport)
    ),
  };
}
