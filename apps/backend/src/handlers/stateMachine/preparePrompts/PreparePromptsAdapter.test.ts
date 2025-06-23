import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenPreparePromptsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import {
  PreparePromptsAdapter,
  PreparePromptsInput,
} from './PreparePromptsAdapter';
import { PreparePromptsAdapterInputMother } from './PreparePromptsAdapterInputMother';
import { ScanningTool } from '@backend/models';

describe('PreparePromptsAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const input = PreparePromptsAdapterInputMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganization('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      await expect(adapter.handle(input)).resolves.not.toThrow();
    });

    it('should throw with invalid args', async () => {
      const { adapter } = setup();

      await expect(
        adapter.handle({ invalid: 'arg' } as unknown as PreparePromptsInput)
      ).rejects.toThrow();
    });
  });

  describe('useCase call and status code', () => {
    it('should call PreparePrompts Use Case', async () => {
      const { adapter, useCase } = setup();

      const input = PreparePromptsAdapterInputMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganization('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      await adapter.handle(input);

      expect(useCase.preparePrompts).toHaveBeenCalledWith({
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
        organization: 'organization-id',
        scanningTool: ScanningTool.PROWLER,
        regions: ['us-east-1'],
        workflows: ['workflow-1'],
      });
    });

    it('should return PreparePrompts Use Case result', async () => {
      const { adapter, useCase } = setup();

      const input = PreparePromptsAdapterInputMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganization('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      useCase.preparePrompts.mockResolvedValue([
        'prompt-uri-1',
        'prompt-uri-2',
      ]);

      const result = await adapter.handle(input);

      expect(result).toEqual(['prompt-uri-1', 'prompt-uri-2']);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { preparePrompts: vi.fn() };
  register(tokenPreparePromptsUseCase, { useValue: useCase });
  return {
    useCase,
    adapter: new PreparePromptsAdapter(),
  };
};
