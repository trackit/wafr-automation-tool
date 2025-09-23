import { ZodError } from 'zod';

import {
  registerTestInfrastructure,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { FindingMother, ScanningTool } from '@backend/models';
import { tokenAssociateFindingsToBestPracticesUseCase } from '@backend/useCases';
import { inject, register, reset } from '@shared/di-container';

import { AssociateFindingsChunkToBestPracticesAdapter } from './AssociateFindingsChunkToBestPracticesAdapter';
import { AssociateFindingsChunkToBestPracticesAdapterEventMother } from './AssociateFindingsChunkToBestPracticesAdapterEventMother';

describe('AssociateFindingsToBestPractices adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter, fakeObjectsStorage } = setup();

      fakeObjectsStorage.objects = {
        'prowler_0.json': JSON.stringify([
          FindingMother.basic().withId('prowler#1').build(),
        ]),
      };
      const event =
        AssociateFindingsChunkToBestPracticesAdapterEventMother.basic()
          .withFindingsChunkURI('s3://test/prowler_0.json')
          .build();
      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should throw with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event =
        AssociateFindingsChunkToBestPracticesAdapterEventMother.basic()
          .withAssessmentId('invalid-uuid')
          .build();

      await expect(adapter.handle(event)).rejects.toThrow(ZodError);
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

  describe('parseScanningToolFromURI', () => {
    it('should parse scanning tool from findings chunk URI', () => {
      const { adapter } = setup();

      const uri =
        's3://bucket/assessments/d2dddd63-3b9a-40f1-bb0f-bd89051fb67b/chunks/prowler_1.json';
      const scanningTool = adapter.parseScanningToolFromURI(uri);
      expect(scanningTool).toBe(ScanningTool.PROWLER);
    });

    it('should throw an error if URI is invalid', () => {
      const { adapter } = setup();

      expect(() =>
        adapter.parseScanningToolFromURI('invalid-uri')
      ).toThrowError();
    });
  });

  describe('fetchFindingsToAssociate', () => {
    it('should fetch findings from findingsChunkURI', async () => {
      const { adapter, fakeObjectsStorage } = setup();

      const event =
        AssociateFindingsChunkToBestPracticesAdapterEventMother.basic()
          .withFindingsChunkURI(`s3://findings-bucket/prowler_0.json`)
          .build();

      fakeObjectsStorage.get = vi
        .fn()
        .mockResolvedValue(
          JSON.stringify([FindingMother.basic().withId('prowler#1').build()])
        );
      await adapter.handle(event);

      expect(fakeObjectsStorage.get).toHaveBeenCalledWith('prowler_0.json');
    });

    it('should return findings and scanning tool from findingsChunkURI', async () => {
      const { adapter, fakeObjectsStorage } = setup();

      const findings = [
        FindingMother.basic().withId('prowler#1').build(),
        FindingMother.basic().withId('prowler#2').build(),
      ];
      vi.spyOn(fakeObjectsStorage, 'get').mockResolvedValue(
        JSON.stringify(findings)
      );

      const event =
        AssociateFindingsChunkToBestPracticesAdapterEventMother.basic()
          .withFindingsChunkURI('s3://findings-bucket/prowler_0.json')
          .build();

      const result = await adapter.fetchFindingsToAssociate(
        event.findingsChunkURI
      );
      expect(result).toEqual({
        scanningTool: ScanningTool.PROWLER,
        findings,
      });
    });
  });

  describe('useCase', () => {
    it('should call useCase with correct parameters', async () => {
      const { adapter, useCase, fakeObjectsStorage } = setup();

      const findings = [
        FindingMother.basic().withId('prowler#1').build(),
        FindingMother.basic().withId('prowler#2').build(),
      ];
      fakeObjectsStorage.objects = {
        'prowler_0.json': JSON.stringify(findings),
      };

      const event =
        AssociateFindingsChunkToBestPracticesAdapterEventMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganizationDomain('test.io')
          .withFindingsChunkURI('s3://findings-bucket/prowler_0.json')
          .build();

      await adapter.handle(event);
      expect(
        useCase.associateFindingsToBestPractices
      ).toHaveBeenCalledExactlyOnceWith({
        assessmentId: event.assessmentId,
        organizationDomain: event.organizationDomain,
        scanningTool: ScanningTool.PROWLER,
        findings,
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { associateFindingsToBestPractices: vitest.fn() };
  register(tokenAssociateFindingsToBestPracticesUseCase, { useValue: useCase });

  return {
    useCase,
    adapter: new AssociateFindingsChunkToBestPracticesAdapter(),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
