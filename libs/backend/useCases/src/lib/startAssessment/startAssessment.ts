import { User } from '@backend/models';
import {
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { inject, createInjectionToken } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

export type StartAssessmentUseCaseArgs = {
  name: string;
  user: User;
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
  private readonly idGenerator = inject(tokenIdGenerator);

  public async startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }> {
    const { name, user } = args;
    const assessmentId = this.idGenerator.generate();
    const workflows =
      args.workflows?.map((workflow) => workflow.toLowerCase()) ?? [];
    const regions = args.regions ?? [];
    const roleArn = args.roleArn ?? this.defaultAssessmentRole;

    await this.stateMachine.startAssessment({
      name,
      regions,
      workflows,
      roleArn,
      assessmentId,
      createdAt: new Date(),
      createdBy: user.id,
      organization: user.organizationDomain,
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
