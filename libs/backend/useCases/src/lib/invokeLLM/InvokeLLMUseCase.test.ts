import {
  registerTestInfrastructure,
  tokenFakeAIService,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { inject, register, reset } from '@shared/di-container';

import {
  AIBestPracticeMetadataMother,
  AIFindingAssociationMother,
  AIFindingMother,
  PromptVariablesMother,
} from '@backend/models';
import { tokenStoreResultsUseCase } from '../storeResults';
import { InvokeLLMUseCaseImpl } from './InvokeLLMUseCase';
import { InvokeLLMUseCaseArgsMother } from './InvokeLLMUseCaseArgsMother';

describe('InvokeLLMUseCase', () => {
  it('should retrieve prompt variables in ObjectsStorage', async () => {
    const { useCase, fakeObjectsStorage } = setup();

    const promptVariables = PromptVariablesMother.basic()
      .withQuestionSetData([AIBestPracticeMetadataMother.basic().build()])
      .withScanningToolData([AIFindingMother.basic().build()])
      .withScanningToolTitle('Test Scanning Tool Title')
      .build();

    fakeObjectsStorage.put({
      key: 'prompt-uri',
      body: JSON.stringify(promptVariables),
    });

    const input = InvokeLLMUseCaseArgsMother.basic()
      .withPromptUri('s3://test-s3-bucket/prompt-uri')
      .build();
    await expect(
      useCase.retrievePromptVariables(input.promptUri)
    ).resolves.toEqual(promptVariables);

    expect(fakeObjectsStorage.get).toHaveBeenCalledExactlyOnceWith({
      key: 'prompt-uri',
    });
  });

  it('should call converse in AIService', async () => {
    const { useCase, fakeAIService, storeResultsUseCase } = setup();

    const promptVariables = PromptVariablesMother.basic()
      .withQuestionSetData([AIBestPracticeMetadataMother.basic().build()])
      .withScanningToolData([AIFindingMother.basic().build()])
      .withScanningToolTitle('Test Scanning Tool Title')
      .build();

    useCase.retrievePromptVariables = vi
      .fn()
      .mockResolvedValue(promptVariables);
    const AIFindingAssociation = AIFindingAssociationMother.basic()
      .withId(1)
      .withStart(1)
      .withEnd(1)
      .build();
    fakeAIService.converse = vi
      .fn()
      .mockResolvedValue(JSON.stringify([AIFindingAssociation]));

    const input = InvokeLLMUseCaseArgsMother.basic()
      .withPromptUri('s3://test-s3-bucket/prompt-uri')
      .withPromptArn('prompt-arn')
      .build();
    await expect(useCase.invokeLLM(input)).resolves.toBeUndefined();

    expect(fakeAIService.converse).toHaveBeenCalledExactlyOnceWith({
      promptArn: 'prompt-arn',
      promptVariables: promptVariables,
    });
    expect(storeResultsUseCase.storeResults).toHaveBeenCalledExactlyOnceWith({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      promptUri: 's3://test-s3-bucket/prompt-uri',
      aiFindingAssociations: [AIFindingAssociation],
    });
  });

  it('should throw an exception if converse response is invalid', async () => {
    const { useCase, fakeAIService } = setup();

    const promptVariables = PromptVariablesMother.basic()
      .withQuestionSetData([AIBestPracticeMetadataMother.basic().build()])
      .withScanningToolData([AIFindingMother.basic().build()])
      .withScanningToolTitle('Test Scanning Tool Title')
      .build();

    useCase.retrievePromptVariables = vi
      .fn()
      .mockResolvedValue(promptVariables);
    fakeAIService.converse = vi.fn().mockResolvedValue('invalid response');

    const input = InvokeLLMUseCaseArgsMother.basic()
      .withPromptUri('s3://test-s3-bucket/prompt-uri')
      .withPromptArn('prompt-arn')
      .build();
    await expect(useCase.invokeLLM(input)).rejects.toThrow(Error);

    expect(fakeAIService.converse).toHaveBeenCalledExactlyOnceWith({
      promptArn: 'prompt-arn',
      promptVariables: promptVariables,
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeObjectsStorage = inject(tokenFakeObjectsStorage);
  vitest.spyOn(fakeObjectsStorage, 'get');
  const fakeAIService = inject(tokenFakeAIService);
  vitest.spyOn(fakeAIService, 'converse');
  const storeResultsUseCase = { storeResults: vitest.fn() };
  register(tokenStoreResultsUseCase, { useValue: storeResultsUseCase });
  return {
    useCase: new InvokeLLMUseCaseImpl(),
    fakeAIService,
    fakeObjectsStorage,
    storeResultsUseCase,
  };
};
