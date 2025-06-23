export class JSONParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JSONParseError';
  }
}

export function parseJsonObject(jsonString?: string): Record<string, unknown> {
  try {
    return JSON.parse(jsonString || '{}');
  } catch (error) {
    throw new JSONParseError(
      `Failed to parse JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function parseJsonArray(jsonString?: string): Record<string, unknown>[] {
  try {
    return JSON.parse(jsonString || '[]');
  } catch (error) {
    throw new JSONParseError(
      `Failed to parse JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
