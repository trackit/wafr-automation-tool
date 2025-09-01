import {
  FakeAssessmentsRepository,
  FakeIdGenerator,
  tokenAssessmentsRepository,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { AssessmentMother } from '@backend/models';
import { register, reset } from '@shared/di-container';

import { InvalidParametersError } from '../Errors';
import {
  GetAssessmentsUseCaseArgs,
  GetAssessmentsUseCaseImpl,
} from './GetAssessmentsUseCase';
import { GetAssessmentsUseCaseArgsMother } from './GetAssessmentsUseCaseArgsMother';

vitest.useFakeTimers();

describe('getAssessments UseCase', () => {
  it('should return all assessments', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment1')
      .withOrganization('test.io')
      .build();

    await fakeAssessmentsRepository.save(assessment);

    const input: GetAssessmentsUseCaseArgs =
      GetAssessmentsUseCaseArgsMother.basic().build();
    const response = await useCase.getAssessments(input);

    expect(fakeAssessmentsRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ organization: 'test.io' })
    );
    expect(response).toEqual({
      assessments: [assessment],
    });
  });

  it('should return an empty list if no assessments', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input: GetAssessmentsUseCaseArgs =
      GetAssessmentsUseCaseArgsMother.basic().build();
    await useCase.getAssessments(input);

    expect(fakeAssessmentsRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ organization: 'test.io' })
    );
  });

  it('should throw if next token is invalid', async () => {
    const { useCase } = setup();

    const input: GetAssessmentsUseCaseArgs =
      GetAssessmentsUseCaseArgsMother.basic().withNextToken('dGVzdA==').build();
    await expect(useCase.getAssessments(input)).rejects.toThrow(
      InvalidParametersError
    );
  });
});

const setup = () => {
  reset();

  const fakeAssessmentsRepository = new FakeAssessmentsRepository();
  vitest.spyOn(fakeAssessmentsRepository, 'getAll');
  register(tokenAssessmentsRepository, {
    useValue: fakeAssessmentsRepository,
  });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });

  const useCase = new GetAssessmentsUseCaseImpl();

  return {
    useCase,
    fakeAssessmentsRepository: fakeAssessmentsRepository,
  };
};
