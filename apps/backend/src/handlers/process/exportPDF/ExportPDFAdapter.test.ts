import { ZodError } from 'zod';

import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenExportPDFUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { ExportPDFAdapter } from './ExportPDFAdapter';
import { ExportPDFAdapterEventMother } from './ExportPDFAdapterEventMother';

describe('exportPDF adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = ExportPDFAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should throw a ZodError with invalid params', async () => {
      const { adapter } = setup();

      const event = { invalid: 'event' };

      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
    });
  });

  it('should call useCase with correct parameters', async () => {
    const { adapter, useCase } = setup();

    const event = ExportPDFAdapterEventMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .withFileExportId('file-export-id')
      .build();

    await adapter.handle(event);

    expect(useCase.exportPDF).toHaveBeenCalledWith({
      assessmentId: 'assessment-id',
      organizationDomain: 'test.io',
      fileExportId: 'file-export-id',
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { exportPDF: vitest.fn() };
  useCase.exportPDF.mockResolvedValueOnce(Promise.resolve());
  register(tokenExportPDFUseCase, { useValue: useCase });

  const adapter = new ExportPDFAdapter();
  return { useCase, adapter };
};
