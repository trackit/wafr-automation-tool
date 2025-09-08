import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  ScanFindingMother,
  ScanningTool,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import {
  StoreFindingsToAssociateUseCaseImpl,
  tokenStoreFindingsToAssociateUseCaseChunkSize,
} from './StoreFindingsToAssociateUseCase';
import { StoreFindingsToAssociateUseCaseArgsMother } from './StoreFindingsToAssociateUseCaseArgsMother';

describe('StoreFindingsToAssociate UseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = StoreFindingsToAssociateUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.storeFindingsToAssociate(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should store findings in objects storage', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .build();
    fakeObjectsStorage.objects = {};
    const args = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();
    await useCase.storeFindingsToAssociate(args);
    const key = StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 0,
    });
    expect(fakeObjectsStorage.objects[key]).toBeDefined();
    const findings = JSON.parse(fakeObjectsStorage.objects[key]);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        id: 'prowler#1',
        isAIAssociated: true,
        hidden: false,
      })
    );
    expect(findings[1]).toEqual(
      expect.objectContaining({
        id: 'prowler#2',
        isAIAssociated: true,
        hidden: false,
      })
    );
  });

  it('should chunk findings if they exceed the maximum size', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(2);
    fakeObjectsStorage.objects = {};
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .build();
    const args = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
        ScanFindingMother.basic().withId('prowler#3').build(),
      ])
      .build();
    await useCase.storeFindingsToAssociate(args);
    const key0 = StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 0,
    });
    const key1 = StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 1,
    });
    expect(fakeObjectsStorage.objects[key0]).toBeDefined();
    expect(fakeObjectsStorage.objects[key1]).toBeDefined();
    const findings0 = JSON.parse(fakeObjectsStorage.objects[key0]);
    const findings1 = JSON.parse(fakeObjectsStorage.objects[key1]);
    expect(findings0).toHaveLength(2);
    expect(findings1).toHaveLength(1);
    expect(findings0[0]).toEqual(expect.objectContaining({ id: 'prowler#1' }));
    expect(findings0[1]).toEqual(expect.objectContaining({ id: 'prowler#2' }));
    expect(findings1[0]).toEqual(expect.objectContaining({ id: 'prowler#3' }));
  });

  it('should return a list of URIs pointing to the chunks findings', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(1);
    fakeObjectsStorage.objects = {};
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .build();
    vi.spyOn(fakeObjectsStorage, 'put')
      .mockResolvedValueOnce(
        's3://1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/chunks/prowler_0.json'
      )
      .mockResolvedValueOnce(
        's3://1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/chunks/prowler_1.json'
      );
    const args = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();
    const uris = await useCase.storeFindingsToAssociate(args);
    expect(uris).toEqual([
      's3://1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/chunks/prowler_0.json',
      's3://1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/chunks/prowler_1.json',
    ]);
  });
});

const setup = (chunkSize?: number) => {
  reset();
  registerTestInfrastructure();
  register(tokenStoreFindingsToAssociateUseCaseChunkSize, {
    useValue: chunkSize ?? 400,
  });
  return {
    useCase: new StoreFindingsToAssociateUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
