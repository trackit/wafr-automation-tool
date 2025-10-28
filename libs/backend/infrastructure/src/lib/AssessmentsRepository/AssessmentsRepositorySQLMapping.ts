import {
  Assessment,
  AssessmentFileExport,
  AssessmentFileExportType,
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

export function toDomainFileExport(e: FileExportEntity): AssessmentFileExport {
  return {
    id: e.id,
    status: e.status,
    ...(e.error && { error: e.error }),
    versionName: e.versionName,
    ...(e.objectKey && { objectKey: e.objectKey }),
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
    fileExports: (e.fileExports ?? []).reduce(
      (acc, fileExport) => {
        if (acc[fileExport.type]) {
          acc[fileExport.type]!.push(toDomainFileExport(fileExport));
        } else {
          acc[fileExport.type] = [toDomainFileExport(fileExport)];
        }
        return acc;
      },
      {} as Record<AssessmentFileExportType, AssessmentFileExport[]>,
    ),
    ...(e.wafrWorkloadArn && { wafrWorkloadArn: e.wafrWorkloadArn }),
    ...(e.opportunityId && { opportunityId: e.opportunityId }),
    ...(e.opportunityCreatedAt && {
      opportunityCreatedAt: e.opportunityCreatedAt,
    }),
  };
}

export function mapFileExportsToEntities(
  assessmentId: string,
  fileExports: Partial<
    Record<AssessmentFileExportType, AssessmentFileExport[]>
  >,
): FileExportEntity[] {
  return Object.entries(fileExports).flatMap(([type, exports]) =>
    exports.map((fileExport) =>
      mapFileExportToEntity(
        assessmentId,
        type as AssessmentFileExportType,
        fileExport,
      ),
    ),
  );
}

function mapFileExportToEntity(
  assessmentId: string,
  type: AssessmentFileExportType,
  fileExport: AssessmentFileExport,
): FileExportEntity {
  return {
    assessmentId,
    type,
    ...fileExport,
  };
}
