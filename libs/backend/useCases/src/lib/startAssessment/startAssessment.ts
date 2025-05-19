import { inject, createInjectionToken } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { tokenAssessmentsStateMachine } from '@backend/infrastructure';

export type StartAssessmentUseCaseArgs = {
  name: string;
  regions?: string[];
  roleArn?: string;
  workflows?: string[];
};

export interface StartAssessmentUseCase {
  startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }>;
}

export class StartAssessmentUseCaseImpl implements StartAssessmentUseCase {
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);
  private readonly defaultAssessmentRole = inject(tokenDefaultAssessmentRole);

  private generateAssessmentId(): string {
    // TODO: why a timestamp, can we use uuid?
    const date = new Date();
    const timestamp = date.getTime();
    return timestamp.toString();
  }

  public async startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }> {
    const { name, regions } = args;
    const assessmentId = this.generateAssessmentId();
    const workflows =
      args.workflows?.map((workflow) => workflow.toLowerCase()) ?? [];

    const roleArn = args.roleArn || this.defaultAssessmentRole;

    await this.stateMachine.startAssessment({
      name,
      regions,
      workflows,
      roleArn,
      assessmentId,
      createdAt: new Date(),
    });
    return { assessmentId };
  }
}

export const tokenStartAssessmentUseCase =
  createInjectionToken<StartAssessmentUseCase>('StartAssessmentUseCase', {
    useClass: StartAssessmentUseCaseImpl,
  });

export const tokenDefaultAssessmentRole = createInjectionToken<string>(
  'DEFAULT_ASSESSMENT_ROLE',
  {
    useFactory: () => {
      const roleArn = process.env.DEFAULT_ASSESSMENT_ROLE;
      assertIsDefined(roleArn, 'DEFAULT_ASSESSMENT_ROLE is not defined');
      return roleArn;
    },
  }
);
