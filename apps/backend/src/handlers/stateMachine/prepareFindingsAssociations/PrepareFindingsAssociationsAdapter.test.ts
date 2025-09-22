import { ZodError } from 'zod';

import { registerTestInfrastructure } from '@backend/infrastructure';
import { ScanningTool } from '@backend/models';
import { tokenPrepareFindingsAssociationsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import {
  PrepareFindingsAssociationsAdapter,
  PrepareFindingsAssociationsInput,
} from './PrepareFindingsAssociationsAdapter';
import { PrepareFindingsAssociationsAdapterEventMother } from './PrepareFindingsAssociationsAdapterEventMother';

describe('PrepareFindingsAssociationsAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const input = PrepareFindingsAssociationsAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganizationDomain('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      await expect(adapter.handle(input)).resolves.not.toThrow();
    });

    it('should throw with invalid args', async () => {
      const { adapter } = setup();

      await expect(
        adapter.handle({
          invalid: 'arg',
        } as unknown as PrepareFindingsAssociationsInput)
      ).rejects.toThrow();
    });

    it('should throw with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = PrepareFindingsAssociationsAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });
  });

  describe('useCase call and status code', () => {
    it('should call PrepareFindingsAssociations Use Case', async () => {
      const { adapter, useCase } = setup();

      const input = PrepareFindingsAssociationsAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganizationDomain('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      await adapter.handle(input);

      expect(useCase.prepareFindingsAssociations).toHaveBeenCalledWith({
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
        organization: 'organization-id',
        scanningTool: ScanningTool.PROWLER,
        regions: ['us-east-1'],
        workflows: ['workflow-1'],
      });
    });

    it('should return PrepareFindingsAssociations Use Case result', async () => {
      const { adapter, useCase } = setup();

      const input = PrepareFindingsAssociationsAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withOrganizationDomain('organization-id')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withScanningTool(ScanningTool.PROWLER)
        .build();
      useCase.prepareFindingsAssociations.mockResolvedValue([
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
  const useCase = { prepareFindingsAssociations: vi.fn() };
  register(tokenPrepareFindingsAssociationsUseCase, { useValue: useCase });
  return {
    useCase,
    adapter: new PrepareFindingsAssociationsAdapter(),
  };
};
