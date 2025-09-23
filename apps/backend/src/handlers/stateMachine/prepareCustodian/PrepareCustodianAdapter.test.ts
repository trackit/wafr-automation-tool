import { tokenPrepareCustodianUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { PrepareCustodianAdapter } from './PrepareCustodianAdapter';

describe('Prepare custodian adapter', () => {
  describe('useCase call', () => {
    it('should call useCase', async () => {
      const { adapter, useCase } = setup();

      await expect(adapter.handle()).resolves.toBe('test-s3-uri');

      expect(useCase.prepareCustodian).toHaveBeenCalledTimes(1);
    });
  });
});

const setup = () => {
  reset();

  const useCase = {
    prepareCustodian: vi.fn().mockResolvedValue('test-s3-uri'),
  };
  register(tokenPrepareCustodianUseCase, { useValue: useCase });

  return { useCase, adapter: new PrepareCustodianAdapter() };
};
