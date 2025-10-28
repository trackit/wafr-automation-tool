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

export function buildUpdateExpression(args: {
  data: Record<string, unknown>;
  UpdateExpressionPath?: string;
  DefaultExpressionAttributeValues?: Record<string, unknown>;
  DefaultExpressionAttributeNames?: Record<string, string>;
}): {
  UpdateExpression: string;
  ExpressionAttributeValues: Record<string, unknown>;
  ExpressionAttributeNames: Record<string, string>;
} {
  const {
    data,
    DefaultExpressionAttributeValues,
    DefaultExpressionAttributeNames,
  } = args;
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> =
    DefaultExpressionAttributeValues || {};
  const expressionAttributeNames: Record<string, string> =
    DefaultExpressionAttributeNames || {};

  if (args.UpdateExpressionPath && !args.UpdateExpressionPath.endsWith('.')) {
    args.UpdateExpressionPath += '.';
  }
  for (const [key, value] of Object.entries(data)) {
    const attributeName = `#${key.replace(/-/g, '_')}`;
    const attributeValue = `:${key.replace(/-/g, '_')}`;
    updateExpressions.push(
      `${args.UpdateExpressionPath ?? ''}${attributeName} = ${attributeValue}`,
    );
    expressionAttributeValues[attributeValue] = value;
    expressionAttributeNames[attributeName] = key;
  }
  return {
    UpdateExpression: `set ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
  };
}
