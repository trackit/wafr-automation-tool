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
    const { useCase } = setup();

    const input = StoreFindingsToAssociateUseCaseArgsMother.basic().build();

    await expect(useCase.storeFindingsToAssociate(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should store findings in objects storage', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();

    await useCase.storeFindingsToAssociate(input);

    const object = await fakeObjectsStorage.get(
      StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
        assessmentId: assessment.id,
        scanningTool: input.scanningTool,
        chunkIndex: 0,
      })
    );
    expect(object).toBeDefined();
    const findings = JSON.parse(object ?? '');
    expect(findings).toHaveLength(2);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        id: input.scanFindings[0].id,
        isAIAssociated: true,
        hidden: false,
      })
    );
    expect(findings[1]).toEqual(
      expect.objectContaining({
        id: input.scanFindings[1].id,
        isAIAssociated: true,
        hidden: false,
      })
    );
  });

  it('should chunk findings if they exceed the maximum size', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(2);

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
        ScanFindingMother.basic().withId('prowler#3').build(),
      ])
      .build();

    await useCase.storeFindingsToAssociate(input);

    const object0 = await fakeObjectsStorage.get(
      StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
        assessmentId: assessment.id,
        scanningTool: input.scanningTool,
        chunkIndex: 0,
      })
    );
    const object1 = await fakeObjectsStorage.get(
      StoreFindingsToAssociateUseCaseImpl.getFindingsChunkPath({
        assessmentId: assessment.id,
        scanningTool: input.scanningTool,
        chunkIndex: 1,
      })
    );
    expect(object0).toBeDefined();
    expect(object1).toBeDefined();
    const findings0 = JSON.parse(object0 ?? '');
    const findings1 = JSON.parse(object1 ?? '');
    expect(findings0).toHaveLength(2);
    expect(findings1).toHaveLength(1);
    expect(findings0[0]).toEqual(
      expect.objectContaining({ id: input.scanFindings[0].id })
    );
    expect(findings0[1]).toEqual(
      expect.objectContaining({ id: input.scanFindings[1].id })
    );
    expect(findings1[0]).toEqual(
      expect.objectContaining({ id: input.scanFindings[2].id })
    );
  });

  it('should return a list of URIs pointing to the chunks findings', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(1);

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    vi.spyOn(fakeObjectsStorage, 'put')
      .mockResolvedValueOnce(`s3://${assessment.id}/chunks/prowler_0.json`)
      .mockResolvedValueOnce(`s3://${assessment.id}/chunks/prowler_1.json`);

    const input = StoreFindingsToAssociateUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();

    const result = await useCase.storeFindingsToAssociate(input);

    expect(result).toEqual([
      `s3://${assessment.id}/chunks/prowler_0.json`,
      `s3://${assessment.id}/chunks/prowler_1.json`,
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
