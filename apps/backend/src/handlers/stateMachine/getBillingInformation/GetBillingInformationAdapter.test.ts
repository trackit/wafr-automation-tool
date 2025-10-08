import { ZodError } from 'zod';

import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenGetBillingInformationUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { GetBillingInformationAdapter } from './GetBillingInformationAdapter';
import { GetBillingInformationAdapterEventMother } from './GetBillingInformationAdapterEventMother';

describe('GetBillingInformationAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetBillingInformationAdapterEventMother.basic().build();
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

    it('should throw with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetBillingInformationAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });
  });

  describe('useCase', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const event = GetBillingInformationAdapterEventMother.basic()
        .withAssessmentId('36472c1c-1ee8-4ee4-953f-df5bf1d6da63')
        .withOrganizationDomain('example.com')
        .build();

      await adapter.handle(event);
      expect(useCase.getBillingInformation).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: event.assessmentId,
          organizationDomain: event.organizationDomain,
        }),
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { getBillingInformation: vitest.fn() };
  register(tokenGetBillingInformationUseCase, { useValue: useCase });

  return { useCase, adapter: new GetBillingInformationAdapter() };
};
