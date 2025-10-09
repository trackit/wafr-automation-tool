import {
  Assessment,
  AssessmentFileExport,
  AssessmentFileExportType,
  BestPractice,
  Pillar,
  Question,
  SeverityType,
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
    results: new Set(e.results),
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
    step: e.step,
    rawGraphData: e.rawGraphData ?? {},
    workflows: e.workflows,
    ...(e.error && { error: e.error }),
    pillars: (e.pillars ?? []).map((p) => toDomainPillar(p)),
    graphData:
      e.graphData ??
      Object.values(e.rawGraphData ?? {}).reduce(
        (acc, data) => {
          acc.findings += data.findings;
          acc.regions = Object.entries(data.regions).reduce(
            (accRegions, [region, count]) => {
              accRegions[region] = (accRegions[region] ?? 0) + count;
              return accRegions;
            },
            acc.regions,
          );
          acc.resourceTypes = Object.entries(data.resourceTypes).reduce(
            (accResourceTypes, [type, count]) => {
              accResourceTypes[type] = (accResourceTypes[type] ?? 0) + count;
              return accResourceTypes;
            },
            acc.resourceTypes,
          );
          acc.severities = Object.entries(data.severities).reduce(
            (accSeverities, [_severity, count]) => {
              const severity = _severity as SeverityType;
              accSeverities[severity] = (accSeverities[severity] ?? 0) + count;
              return accSeverities;
            },
            acc.severities,
          );
          return acc;
        },
        {
          findings: 0,
          regions: {},
          resourceTypes: {},
          severities: {},
        },
      ),
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
  };
}
