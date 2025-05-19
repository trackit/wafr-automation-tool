import { assertIsDefined } from './assertIsDefined';

describe('assertIsDefined', () => {
  it('should throw an error if the value is undefined', () => {
    expect(() => assertIsDefined(undefined)).toThrowError();
  });

  it('should throw an error if the value is null', () => {
    expect(() => assertIsDefined(null)).toThrowError();
  });

  it('should not throw an error if the value is defined', () => {
    expect(() => assertIsDefined(42)).not.toThrow();
  });

  it('should not throw an error if the value is an empty string', () => {
    expect(() => assertIsDefined('')).not.toThrow();
  });

  it('should not throw an error if the value is 0', () => {
    expect(() => assertIsDefined(0)).not.toThrow();
  });

  it('should not throw an error if the value is false', () => {
    expect(() => assertIsDefined(false)).not.toThrow();
  });
});
