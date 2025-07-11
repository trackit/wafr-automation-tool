export class JSONParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JSONParseError';
  }
}

export function parseJsonObject(jsonString?: string): Record<string, unknown> {
  try {
    const parsedObject = JSON.parse(jsonString || '{}');
    if (
      typeof parsedObject !== 'object' ||
      parsedObject === null ||
      Array.isArray(parsedObject)
    ) {
      throw new JSONParseError('Parsed JSON is not an object');
    }
    return parsedObject;
  } catch (error) {
    throw new JSONParseError(
      `Failed to parse JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function parseJsonArray(jsonString?: string): unknown[] {
  try {
    const parsedArray = JSON.parse(jsonString || '[]');
    if (!Array.isArray(parsedArray) || parsedArray === null) {
      throw new JSONParseError('Parsed JSON is not an array');
    }
    return parsedArray;
  } catch (error) {
    throw new JSONParseError(
      `Failed to parse JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
