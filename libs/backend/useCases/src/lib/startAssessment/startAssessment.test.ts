import {
  FakeIdGenerator,
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { register, reset } from '@shared/di-container';

import {
  StartAssessmentUseCaseArgs,
  StartAssessmentUseCaseImpl,
} from './startAssessment';
import { StartAssessmentUseCaseArgsMother } from './StartAssessmentUseCaseArgsMother';

vitest.useFakeTimers();

describe('startAssessment UseCase', () => {
  it('should start an assessment', async () => {
    const { useCase, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic().build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ name: input.name })
    );
  });

  it('should start an assessment with default regions and workflows', async () => {
    const { useCase, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic().build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        regions: [],
        workflows: [],
      })
    );
  });

  it('should start an assessment with complete args', async () => {
    const { useCase, fakeAssessmentsStateMachine, date } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic()
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withWorkflows(['workflow-1', 'workflow-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/test-role')
        .build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: input.name,
        regions: input.regions,
        roleArn: input.roleArn,
        workflows: input.workflows,
        createdAt: date,
        assessmentId: expect.any(String),
        createdBy: input.user.id,
        organization: input.user.organizationDomain,
      })
    );
  });

  it('should start an assessment with lowercase workflows name', async () => {
    const { useCase, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic()
        .withWorkflows(['workFloW-1', 'WorKflOw-2'])
        .build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        workflows: ['workflow-1', 'workflow-2'],
      })
    );
  });
});

const setup = () => {
  reset();
  const fakeAssessmentsStateMachine = {
    startAssessment: vitest.fn(),
  };

  register(tokenAssessmentsStateMachine, {
    useValue: fakeAssessmentsStateMachine,
  });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
  const date = new Date();
  vitest.setSystemTime(date);

  const useCase = new StartAssessmentUseCaseImpl();

  return { useCase, fakeAssessmentsStateMachine, date };
};
