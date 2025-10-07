import { parseJsonObject } from './utils';

export function getAssessmentPK(organization: string): string {
  return organization;
}

export function getAssessmentSK(assessmentId: string): string {
  return `ASSESSMENT#${assessmentId}`;
}

export function getFindingPK(args: {
  assessmentId: string;
  organizationDomain: string;
}): string {
  return `${args.organizationDomain}#${args.assessmentId}#FINDINGS`;
}

export function getBestPracticeCustomId(args: {
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
}): string {
  return `${args.pillarId}#${args.questionId}#${args.bestPracticeId}`;
}

export function encodeNextToken(
  nextToken?: Record<string, unknown>,
): string | undefined {
  if (!nextToken) return undefined;
  return Buffer.from(JSON.stringify(nextToken)).toString('base64');
}

export function decodeNextToken(
  nextToken?: string,
): Record<string, unknown> | undefined {
  if (!nextToken) return undefined;
  return parseJsonObject(Buffer.from(nextToken, 'base64').toString('utf8'));
}
