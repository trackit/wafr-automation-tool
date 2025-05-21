import {
  FakeIdGenerator,
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { register, reset } from '@shared/di-container';

import {
  tokenDefaultAssessmentRole,
  StartAssessmentUseCaseImpl,
  StartAssessmentUseCaseArgs,
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

  it('should start an assessment with default regions, workflows and role', async () => {
    const { useCase, defaultRole, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic().build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        regions: [],
        roleArn: defaultRole,
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
  const defaultRole = 'arn:aws:iam::123456789012:role/default-role';
  const fakeAssessmentsStateMachine = {
    startAssessment: vitest.fn(),
  };

  register(tokenAssessmentsStateMachine, {
    useValue: fakeAssessmentsStateMachine,
  });
  register(tokenDefaultAssessmentRole, { useValue: defaultRole });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
  const date = new Date();
  vitest.setSystemTime(date);

  const useCase = new StartAssessmentUseCaseImpl();

  return { useCase, defaultRole, fakeAssessmentsStateMachine, date };
};
