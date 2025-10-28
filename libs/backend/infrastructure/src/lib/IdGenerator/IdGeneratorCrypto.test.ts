import { IdGeneratorCrypto } from './IdGeneratorCrypto';

describe('IdGeneratorCrypto', () => {
  describe('generate', () => {
    it('should generate a unique ID', () => {
      const { idGenerator } = setup();

      const firstId = idGenerator.generate();
      const secondId = idGenerator.generate();

      expect(firstId).not.toEqual(secondId);
    });

    it('should generate a valid UUID', () => {
      const { idGenerator } = setup();

      const id = idGenerator.generate();

      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });
});

const setup = () => {
  return { idGenerator: new IdGeneratorCrypto() };
};
