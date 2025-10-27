import {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExports,
  BestPractice,
  Pillar,
  Question,
} from '@backend/models';
import { getAssessmentPK, getAssessmentSK } from '@shared/utils';

import {
  DynamoDBAssessment,
  DynamoDBAssessmentFileExport,
  DynamoDBAssessmentFileExports,
  DynamoDBPillar,
  DynamoDBQuestion,
} from './AssessmentsRepositoryDynamoDBModels';

export function toDynamoDBBestPracticeItem(
  bestPractice: BestPractice,
): BestPractice {
  return {
    description: bestPractice.description,
    id: bestPractice.id,
    label: bestPractice.label,
    primaryId: bestPractice.primaryId,
    results:
      bestPractice.results.size > 0
        ? bestPractice.results
        : new Set<string>(['']), // Dirty hack because DynamoDB does not allow empty sets
    risk: bestPractice.risk,
    checked: bestPractice.checked,
  };
}

export function toDynamoDBQuestionItem(question: Question): DynamoDBQuestion {
  return {
    bestPractices: question.bestPractices.reduce(
      (bestPractices, bestPractice) => ({
        ...bestPractices,
        [bestPractice.id]: toDynamoDBBestPracticeItem(bestPractice),
      }),
      {},
    ),
    disabled: question.disabled,
    id: question.id,
    label: question.label,
    none: question.none,
    primaryId: question.primaryId,
  };
}

export function toDynamoDBPillarItem(pillar: Pillar): DynamoDBPillar {
  return {
    disabled: pillar.disabled,
    id: pillar.id,
    label: pillar.label,
    primaryId: pillar.primaryId,
    questions: pillar.questions.reduce(
      (questions, question) => ({
        ...questions,
        [question.id]: toDynamoDBQuestionItem(question),
      }),
      {},
    ),
  };
}

export function toDynamoDBAssessmentItem(
  assessment: Assessment,
): DynamoDBAssessment {
  return {
    PK: getAssessmentPK(assessment.organization),
    SK: getAssessmentSK(assessment.id),
    createdAt: assessment.createdAt.toISOString(),
    createdBy: assessment.createdBy,
    executionArn: assessment.executionArn,
    pillars: assessment.pillars?.reduce(
      (pillars, pillar) => ({
        ...pillars,
        [pillar.id]: toDynamoDBPillarItem(pillar),
      }),
      {},
    ),
    graphData: assessment.graphData,
    id: assessment.id,
    name: assessment.name,
    organization: assessment.organization,
    questionVersion: assessment.questionVersion,
    rawGraphData: assessment.rawGraphData,
    regions: assessment.regions,
    exportRegion: assessment.exportRegion,
    roleArn: assessment.roleArn,
    finishedAt: assessment.finishedAt?.toISOString(),
    workflows: assessment.workflows,
    error: assessment.error,
    wafrWorkloadArn: assessment.wafrWorkloadArn,
    opportunityId: assessment.opportunityId,
    ...(assessment.fileExports && {
      fileExports: Object.fromEntries(
        Object.entries(assessment.fileExports).map(([k, v]) => [
          k,
          Object.fromEntries(
            (v as AssessmentFileExport[]).map((fileExport) => [
              fileExport.id,
              toDynamoDBFileExportItem(fileExport),
            ]),
          ),
        ]),
      ) as DynamoDBAssessmentFileExports,
    }),
  };
}

export function toDynamoDBFileExportItem(
  assessmentFileExport: AssessmentFileExport,
): DynamoDBAssessmentFileExport {
  return {
    ...assessmentFileExport,
    createdAt: assessmentFileExport.createdAt.toISOString(),
  };
}

export function toDynamoDBAssessmentBody(
  assessmentBody: AssessmentBody,
): Record<string, unknown> {
  return {
    ...assessmentBody,
    ...(assessmentBody.pillars && {
      pillars: assessmentBody.pillars.reduce(
        (pillars, pillar) => ({
          ...pillars,
          [pillar.id]: toDynamoDBPillarItem(pillar),
        }),
        {},
      ),
    }),
    ...(assessmentBody.fileExports && {
      fileExports: Object.fromEntries(
        Object.entries(assessmentBody.fileExports).map(([k, v]) => [
          k,
          Object.fromEntries(
            (v as AssessmentFileExport[]).map((fileExport) => [
              fileExport.id,
              toDynamoDBFileExportItem(fileExport),
            ]),
          ),
        ]),
      ),
    }),
  };
}

export function fromDynamoDBBestPracticeItem(item: BestPractice): BestPractice {
  return {
    description: item.description,
    id: item.id,
    label: item.label,
    primaryId: item.primaryId,
    results: new Set([...item.results].filter((result) => result !== '')), // Filter out empty strings due to our dirty hack
    risk: item.risk,
    checked: item.checked,
  };
}

export function fromDynamoDBQuestionItem(item: DynamoDBQuestion): Question {
  return {
    bestPractices: Object.values(item.bestPractices).map((bestPractice) =>
      fromDynamoDBBestPracticeItem(bestPractice),
    ),
    disabled: item.disabled,
    id: item.id,
    label: item.label,
    none: item.none,
    primaryId: item.primaryId,
  };
}

export function fromDynamoDBPillarItem(item: DynamoDBPillar): Pillar {
  return {
    disabled: item.disabled,
    id: item.id,
    label: item.label,
    primaryId: item.primaryId,
    questions: Object.values(item.questions).map((question) =>
      fromDynamoDBQuestionItem(question),
    ),
  };
}

export function fromDynamoDBFileExportItem(
  item: DynamoDBAssessmentFileExport,
): AssessmentFileExport {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
  };
}

export function fromDynamoDBAssessmentItem(
  item: DynamoDBAssessment | undefined,
): Assessment | undefined {
  if (!item) return undefined;
  const assessment = item;
  return {
    createdAt: new Date(assessment.createdAt),
    createdBy: assessment.createdBy,
    executionArn: assessment.executionArn,
    ...(assessment.pillars && {
      pillars: Object.values(assessment.pillars).map((pillar) =>
        fromDynamoDBPillarItem(pillar),
      ),
    }),
    graphData: assessment.graphData,
    id: assessment.id,
    name: assessment.name,
    organization: assessment.organization,
    questionVersion: assessment.questionVersion,
    rawGraphData: assessment.rawGraphData,
    regions: assessment.regions,
    exportRegion: assessment.exportRegion,
    roleArn: assessment.roleArn,
    finishedAt: assessment.finishedAt
      ? new Date(assessment.finishedAt)
      : undefined,
    workflows: assessment.workflows,
    error: assessment.error,
    opportunityId: assessment.opportunityId,
    wafrWorkloadArn: assessment.wafrWorkloadArn,
    ...(assessment.fileExports && {
      fileExports: Object.fromEntries(
        Object.entries(assessment.fileExports).map(([k, v]) => [
          k,
          Object.values(v as Record<string, DynamoDBAssessmentFileExport>).map(
            (item) => fromDynamoDBFileExportItem(item),
          ),
        ]),
      ) as AssessmentFileExports,
    }),
  };
}
