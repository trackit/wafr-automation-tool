import { parseJson, JSONParseError } from './parseJson';

describe('parseJson', () => {
  it('should parse valid JSON strings', () => {
    const jsonString = '{"key": "value", "number": 42, "boolean": true}';
    const result = parseJson(jsonString);
    expect(result).toEqual({ key: 'value', number: 42, boolean: true });
  });

  it('should return an empty object for undefined', () => {
    expect(parseJson(undefined)).toEqual({});
  });

  it('should return an empty object for empty strings', () => {
    expect(parseJson('')).toEqual({});
  });

  it('should throw a JSONParseError for invalid JSON strings', () => {
    const invalidJsonString = '{"key": "value", "number": 42, "boolean": true'; // Missing closing brace
    expect(() => parseJson(invalidJsonString)).toThrow(JSONParseError);
  });
});
