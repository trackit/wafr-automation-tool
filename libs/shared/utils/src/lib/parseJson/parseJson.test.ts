import { JSONParseError,parseJsonArray, parseJsonObject } from './parseJson';

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

  it('should throw a JSONParseError for non-object JSON strings', () => {
    const nonObjectJsonString = '[1, 2, 3]'; // Not an object
    expect(() => parseJsonObject(nonObjectJsonString)).toThrow(JSONParseError);
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

  it('should parse a JSON array with non objects', () => {
    const jsonString = '[1, 2, 3]';
    const result = parseJsonArray(jsonString);
    expect(result).toEqual([1, 2, 3]);
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

  it('should throw a JSONParseError for non-array JSON strings', () => {
    const nonArrayJsonString = '{"key": "value"}'; // Not an array
    expect(() => parseJsonArray(nonArrayJsonString)).toThrow(JSONParseError);
  });
});
