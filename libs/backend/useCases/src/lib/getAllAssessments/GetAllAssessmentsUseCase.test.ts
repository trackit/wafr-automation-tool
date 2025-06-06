import {
  FakeAssessmentsRepository,
  FakeIdGenerator,
  tokenAssessmentsRepository,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { register, reset } from '@shared/di-container';

import { AssessmentMother } from '@backend/models';
import { InvalidParametersError } from '../Errors';
import {
  GetAllAssessmentsUseCaseArgs,
  GetAllAssessmentsUseCaseImpl,
} from './GetAllAssessmentsUseCase';
import { GetAllAssessmentsUseCaseArgsMother } from './GetAllAssessmentsUseCaseArgsMother';

vitest.useFakeTimers();

describe('getAllAssessments UseCase', () => {
  it('should return all assessments', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment1')
      .withOrganization('test.io')
      .build();

    await fakeAssessmentsRepository.save(assessment);

    const input: GetAllAssessmentsUseCaseArgs =
      GetAllAssessmentsUseCaseArgsMother.basic().build();
    const response = await useCase.getAllAssessments(input);

    expect(fakeAssessmentsRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ organization: 'test.io' })
    );
    expect(response).toEqual({
      assessments: [assessment],
    });
  });

  it('should return an empty list if no assessments', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input: GetAllAssessmentsUseCaseArgs =
      GetAllAssessmentsUseCaseArgsMother.basic().build();
    await useCase.getAllAssessments(input);

    expect(fakeAssessmentsRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ organization: 'test.io' })
    );
  });

  it('should throw if next token is invalid', async () => {
    const { useCase } = setup();

    const input: GetAllAssessmentsUseCaseArgs =
      GetAllAssessmentsUseCaseArgsMother.basic()
        .withNextToken('dGVzdA==')
        .build();
    expect(useCase.getAllAssessments(input)).rejects.toThrow(
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

  const useCase = new GetAllAssessmentsUseCaseImpl();

  return {
    useCase,
    fakeAssessmentsRepository: fakeAssessmentsRepository,
  };
};
