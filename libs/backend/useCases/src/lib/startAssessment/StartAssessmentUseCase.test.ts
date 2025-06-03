import {
  FakeAssessmentsStateMachine,
  FakeIdGenerator,
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { register, reset } from '@shared/di-container';

import {
  StartAssessmentUseCaseArgs,
  StartAssessmentUseCaseImpl,
} from './StartAssessmentUseCase';
import { StartAssessmentUseCaseArgsMother } from './StartAssessmentUseCaseArgsMother';

vitest.useFakeTimers();

describe('startAssessment UseCase', () => {
  it('should start an assessment', async () => {
    const { useCase, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ name: 'test assessment' })
    );
  });

  it('should start an assessment with default regions and workflows', async () => {
    const { useCase, fakeAssessmentsStateMachine } = setup();

    const input: StartAssessmentUseCaseArgs =
      StartAssessmentUseCaseArgsMother.basic()
        .withRegions(undefined)
        .withWorkflows(undefined)
        .build();
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
        .withUser(
          UserMother.basic()
            .withEmail('user-id@test.io')
            .withId('user-id')
            .withOrganizationDomain('test.io')
            .build()
        )
        .build();
    await useCase.startAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: 'Test Assessment',
        regions: ['us-west-1', 'us-west-2'],
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: ['workflow-1', 'workflow-2'],
        createdAt: date,
        assessmentId: expect.any(String),
        createdBy: 'user-id',
        organization: 'test.io',
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

  const fakeAssessmentsStateMachine = new FakeAssessmentsStateMachine();
  vitest.spyOn(fakeAssessmentsStateMachine, 'startAssessment');
  register(tokenAssessmentsStateMachine, {
    useValue: fakeAssessmentsStateMachine,
  });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
  const date = new Date();
  vitest.setSystemTime(date);

  const useCase = new StartAssessmentUseCaseImpl();

  return { useCase, fakeAssessmentsStateMachine, date };
};
