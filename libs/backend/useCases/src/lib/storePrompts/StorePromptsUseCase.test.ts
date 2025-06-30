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

import {
  StorePromptsUseCaseImpl,
  tokenStorePromptsUseCaseChunkSize,
} from './StorePromptsUseCase';
import { StorePromptsUseCaseArgsMother } from './StorePromptsUseCaseArgsMother';
import { NotFoundError } from '../Errors';
import { AIBestPracticeService } from '../../services/AIBestPracticeService';

describe('StorePrompts UseCase', () => {
  it('should throw an NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    const args = StorePromptsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await expect(useCase.storePrompts(args)).rejects.toThrow(NotFoundError);
  });

  it('should store findings in objects storage', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();
    fakeAssessmentsRepository.assessments['assessment-id#organization-id'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('organization-id')
        .build();
    fakeObjectsStorage.objects = {};
    const args = StorePromptsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();
    await useCase.storePrompts(args);
    const key = StorePromptsUseCaseImpl.getFindingsChunkPath({
      assessmentId: 'assessment-id',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 0,
    });
    expect(fakeObjectsStorage.objects[key]).toBeDefined();
    const findings = JSON.parse(fakeObjectsStorage.objects[key]);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toEqual(expect.objectContaining({ id: 'prowler#1' }));
    expect(findings[1]).toEqual(expect.objectContaining({ id: 'prowler#2' }));
  });

  it('should chunk findings if they exceed the maximum size', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(2);
    fakeObjectsStorage.objects = {};
    fakeAssessmentsRepository.assessments['assessment-id#organization-id'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('organization-id')
        .build();
    const args = StorePromptsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
        ScanFindingMother.basic().withId('prowler#3').build(),
      ])
      .build();
    await useCase.storePrompts(args);
    const key0 = StorePromptsUseCaseImpl.getFindingsChunkPath({
      assessmentId: 'assessment-id',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 0,
    });
    const key1 = StorePromptsUseCaseImpl.getFindingsChunkPath({
      assessmentId: 'assessment-id',
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

  it('should store chunks prompt variables in objects storage', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();
    fakeObjectsStorage.objects = {};
    fakeAssessmentsRepository.assessments['assessment-id#organization-id'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('organization-id')
        .build();
    vi.spyOn(
      AIBestPracticeService,
      'createAIBestPracticeMetadatas'
    ).mockReturnValue([
      {
        id: 1,
        pillarLabel: 'Pillar 1',
        questionLabel: 'Question 1',
        bestPracticeLabel: 'Best Practice 1',
        bestPracticeDescription: 'Description 1',
      },
    ]);
    const args = StorePromptsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic()
          .withId('prowler#1')
          .withStatusDetail('Sample status detail')
          .withRiskDetails('Sample risk details')
          .build(),
      ])
      .build();
    await useCase.storePrompts(args);

    const key = StorePromptsUseCaseImpl.getPromptVariablesChunkPath({
      assessmentId: 'assessment-id',
      scanningTool: ScanningTool.PROWLER,
      chunkIndex: 0,
    });
    expect(fakeObjectsStorage.objects[key]).toBeDefined();
    const promptVariables = JSON.parse(fakeObjectsStorage.objects[key]);
    expect(promptVariables).toEqual({
      scanningToolTitle: ScanningTool.PROWLER,
      scanningToolData: [
        expect.objectContaining({
          id: 'prowler#1',
          statusDetail: 'Sample status detail',
          riskDetails: 'Sample risk details',
        }),
      ],
      questionSetData: [
        {
          id: 1,
          pillarLabel: 'Pillar 1',
          questionLabel: 'Question 1',
          bestPracticeLabel: 'Best Practice 1',
          bestPracticeDescription: 'Description 1',
        },
      ],
    });
  });

  it('should return a list of URIs pointing to the chunks prompt variables objects', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup(1);
    fakeObjectsStorage.objects = {};
    fakeAssessmentsRepository.assessments['assessment-id#organization-id'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('organization-id')
        .build();
    vi.spyOn(fakeObjectsStorage, 'put')
      .mockResolvedValueOnce(
        's3://assessment-id/prompts-variables/prowler_0.json'
      )
      .mockResolvedValueOnce(
        's3://assessment-id/prompts-variables/prowler_1.json'
      );
    const args = StorePromptsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withScanFindings([
        ScanFindingMother.basic().withId('prowler#1').build(),
        ScanFindingMother.basic().withId('prowler#2').build(),
      ])
      .build();
    const uris = await useCase.storePrompts(args);
    expect(uris).toEqual([
      's3://assessment-id/prompts-variables/prowler_0.json',
      's3://assessment-id/prompts-variables/prowler_1.json',
    ]);
  });
});

const setup = (chunkSize?: number) => {
  reset();
  registerTestInfrastructure();
  register(tokenStorePromptsUseCaseChunkSize, { useValue: chunkSize ?? 400 });
  return {
    useCase: new StorePromptsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
