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
    ...(e.finishedAt && { finishedAt: e.finishedAt }),
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
    ...(e.opportunityCreatedAt && {
      opportunityCreatedAt: e.opportunityCreatedAt,
    }),
  };
}

export function mapPillarsToEntities(
  assessmentId: string,
  pillars: Pillar[],
): PillarEntity[] {
  return pillars.map((pillar) => mapPillarToEntity(assessmentId, pillar));
}

function mapPillarToEntity(assessmentId: string, pillar: Pillar): PillarEntity {
  const pillarEntity = new PillarEntity();
  pillarEntity.assessmentId = assessmentId;
  pillarEntity.id = pillar.id;
  pillarEntity.disabled = pillar.disabled;
  pillarEntity.label = pillar.label;
  pillarEntity.primaryId = pillar.primaryId;
  pillarEntity.questions = mapQuestionsToEntities(
    assessmentId,
    pillar.id,
    pillar.questions,
  );

  return pillarEntity;
}

function mapQuestionsToEntities(
  assessmentId: string,
  pillarId: string,
  questions: Question[],
): QuestionEntity[] {
  return questions.map((question) =>
    mapQuestionToEntity(assessmentId, pillarId, question),
  );
}

function mapQuestionToEntity(
  assessmentId: string,
  pillarId: string,
  question: Question,
): QuestionEntity {
  const questionEntity = new QuestionEntity();
  questionEntity.assessmentId = assessmentId;
  questionEntity.pillarId = pillarId;
  questionEntity.id = question.id;
  questionEntity.disabled = question.disabled;
  questionEntity.label = question.label;
  questionEntity.none = question.none;
  questionEntity.primaryId = question.primaryId;
  questionEntity.bestPractices = mapBestPracticesToEntities(
    assessmentId,
    pillarId,
    question.id,
    question.bestPractices,
  );

  return questionEntity;
}

function mapBestPracticesToEntities(
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPractices: BestPractice[],
): BestPracticeEntity[] {
  return bestPractices.map((bp) =>
    mapBestPracticeToEntity(assessmentId, pillarId, questionId, bp),
  );
}

function mapBestPracticeToEntity(
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bp: BestPractice,
): BestPracticeEntity {
  const bpEntity = new BestPracticeEntity();
  bpEntity.assessmentId = assessmentId;
  bpEntity.pillarId = pillarId;
  bpEntity.questionId = questionId;
  bpEntity.id = bp.id;
  bpEntity.description = bp.description;
  bpEntity.label = bp.label;
  bpEntity.primaryId = bp.primaryId;
  bpEntity.risk = bp.risk;
  bpEntity.checked = bp.checked;
  bpEntity.results = Array.from(bp.results);

  return bpEntity;
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
