import { tokenComputeGraphDataUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';
import { ZodError } from 'zod';
import { ComputeGraphDataAdapter } from './ComputeGraphAdapter';
import { ComputeGraphDataAdapterArgsMother } from './ComputeGraphDataAdapterArgsMother';

describe('ComputeGraphDataAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = ComputeGraphDataAdapterArgsMother.basic().build();
      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should throw ZodError if args are missing', async () => {
      const { adapter } = setup();

      const event = {};
      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });

    it('should throw ZodError if args are invalid', async () => {
      const { adapter } = setup();

      const event = {
        invalid: 'event',
      };
      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });
  });

  describe('useCase', () => {
    it('should call useCase with assessmentId and organization', async () => {
      const { adapter, useCase } = setup();

      const event = ComputeGraphDataAdapterArgsMother.basic()
        .withAssessmentId('36472c1c-1ee8-4ee4-953f-df5bf1d6da63')
        .withOrganization('example.com')
        .build();

      await adapter.handle(event);
      expect(useCase.computeGraphData).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '36472c1c-1ee8-4ee4-953f-df5bf1d6da63',
          organization: 'example.com',
        })
      );
    });
  });
});

const setup = () => {
  reset();
  const useCase = { computeGraphData: vitest.fn() };
  register(tokenComputeGraphDataUseCase, { useValue: useCase });
  return { useCase, adapter: new ComputeGraphDataAdapter() };
};
