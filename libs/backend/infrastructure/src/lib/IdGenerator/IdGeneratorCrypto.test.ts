import { IdGeneratorCrypto } from './IdGeneratorCrypto';

describe('IdGenerator', () => {
  it('should generate a unique ID', () => {
    const idGenerator = new IdGeneratorCrypto();
    const id1 = idGenerator.generate();
    const id2 = idGenerator.generate();
    expect(id1).not.toEqual(id2);
  });

  it('should generate a valid UUID', () => {
    const idGenerator = new IdGeneratorCrypto();
    const id = idGenerator.generate();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
