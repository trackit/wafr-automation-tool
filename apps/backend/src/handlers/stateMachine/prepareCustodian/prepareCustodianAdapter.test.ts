import {
  NotFoundError,
  tokenPrepareCustodianUseCase,
  tokenStartAssessmentUseCase,
} from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { prepareCustodianAdapter } from './prepareCustodianAdapter';

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
  const adapter = new prepareCustodianAdapter();
  return { useCase, adapter };
};
