import { chunk } from './chunk';

describe('chunk', () => {
  it('should return an empty array when input is empty', () => {
    const result = chunk([], 2);
    expect(result).toEqual([]);
  });

  it('should return the same array when chunk size is greater than array length', () => {
    const result = chunk([1, 2, 3], 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('should split the array into chunks of specified size', () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle chunk size of 1', () => {
    const result = chunk([1, 2, 3], 1);
    expect(result).toEqual([[1], [2], [3]]);
  });

  it('should handle chunk size equal to array length', () => {
    const result = chunk([1, 2, 3], 3);
    expect(result).toEqual([[1, 2, 3]]);
  });
});
