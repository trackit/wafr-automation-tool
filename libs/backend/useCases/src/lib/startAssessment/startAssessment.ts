import {
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

export type StartAssessmentUseCaseArgs = {
  name: string;
  user: User;
  regions?: string[];
  roleArn: string;
  workflows?: string[];
};

export interface StartAssessmentUseCase {
  startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }>;
}

export class StartAssessmentUseCaseImpl implements StartAssessmentUseCase {
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);
  private readonly idGenerator = inject(tokenIdGenerator);

  public async startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }> {
    const { name, user, roleArn } = args;
    const assessmentId = this.idGenerator.generate();
    const workflows =
      args.workflows?.map((workflow) => workflow.toLowerCase()) ?? [];
    const regions = args.regions ?? [];

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
