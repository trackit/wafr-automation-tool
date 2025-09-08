import { ZodError } from 'zod';

import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenCleanupUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { CleanupAdapter } from './CleanupAdapter';
import { CleanupAdapterEventMother } from './CleanupAdapterEventMother';

describe('cleanup adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CleanupAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should throw with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = CleanupAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });
  });

  describe('useCase', () => {
    it('should call useCase with assessmentId, organization and error', async () => {
      const { adapter, useCase } = setup();

      const event = CleanupAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .withError({
          Cause: 'test-cause',
          Error: 'test-error',
        })
        .build();

      await expect(adapter.handle(event)).resolves.toBeUndefined();
      expect(useCase.cleanup).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          organization: 'test.io',
          error: { Cause: 'test-cause', Error: 'test-error' },
        })
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { cleanup: vitest.fn() };
  register(tokenCleanupUseCase, { useValue: useCase });
  const adapter = new CleanupAdapter();
  return { useCase, adapter };
};
