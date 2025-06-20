import { tokenInvokeLLMUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { registerTestInfrastructure } from '@backend/infrastructure';
import { InvokeLLMAdapterEventMother } from './InvokeLLMAdapterEventMother';
import { InvokeLLMAdapter } from './invokeLLM';

describe('invokeLLM adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = InvokeLLMAdapterEventMother.basic().build();
      await expect(adapter.handle(event)).resolves.toBeUndefined();
    });
    it('should throw with invalid args', async () => {
      const { adapter } = setup();

      await expect(
        adapter.handle({
          invalid: 'event',
        })
      ).rejects.toThrow();
    });
  });
  describe('useCase', () => {
    it('should call InvokeLLM with args', async () => {
      const { adapter, useCase } = setup();

      const event = InvokeLLMAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withPromptArn('prompt-arn')
        .withPromptUri('prompt-uri')
        .build();

      await expect(adapter.handle(event)).resolves.toBeUndefined();
      expect(useCase.invokeLLM).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: 'assessment-id',
          organization: 'test.io',
          promptArn: 'prompt-arn',
          promptUri: 'prompt-uri',
        })
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { invokeLLM: vitest.fn() };
  register(tokenInvokeLLMUseCase, { useValue: useCase });
  const adapter = new InvokeLLMAdapter();
  return { useCase, adapter };
};
