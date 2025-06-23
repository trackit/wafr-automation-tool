import { parseJsonObject, parseJsonArray, JSONParseError } from './parseJson';

describe('parseJsonObject', () => {
  it('should parse valid JSON strings', () => {
    const jsonString = '{"key": "value", "number": 42, "boolean": true}';
    const result = parseJsonObject(jsonString);
    expect(result).toEqual({ key: 'value', number: 42, boolean: true });
  });

  it('should return an empty object for undefined', () => {
    expect(parseJsonObject(undefined)).toEqual({});
  });

  it('should return an empty object for empty strings', () => {
    expect(parseJsonObject('')).toEqual({});
  });

  it('should throw a JSONParseError for invalid JSON strings', () => {
    const invalidJsonString = '{"key": "value", "number": 42, "boolean": true'; // Missing closing brace
    expect(() => parseJsonObject(invalidJsonString)).toThrow(JSONParseError);
  });
});

describe('parseJsonArray', () => {
  it('should parse valid JSON arrays', () => {
    const jsonString = '[{"key": "value"}, {"number": 42}, {"boolean": true}]';
    const result = parseJsonArray(jsonString);
    expect(result).toEqual([
      { key: 'value' },
      { number: 42 },
      { boolean: true },
    ]);
  });

  it('should return an empty array for undefined', () => {
    expect(parseJsonArray(undefined)).toEqual([]);
  });

  it('should return an empty array for empty strings', () => {
    expect(parseJsonArray('')).toEqual([]);
  });

  it('should throw a JSONParseError for invalid JSON arrays', () => {
    const invalidJsonString = '[{"key": "value", "number": 42, "boolean": true';
    expect(() => parseJsonArray(invalidJsonString)).toThrow(JSONParseError);
  });
});
