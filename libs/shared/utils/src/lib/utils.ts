import { parseJsonObject } from '.';

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
