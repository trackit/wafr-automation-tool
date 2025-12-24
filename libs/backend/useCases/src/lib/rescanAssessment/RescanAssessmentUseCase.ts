import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenLogger,
} from '@backend/infrastructure';
import {
  type Assessment,
  type AssessmentVersion,
  type User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type RescanAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface RescanAssessmentUseCase {
  rescanAssessment(args: RescanAssessmentUseCaseArgs): Promise<void>;
}

export class RescanAssessmentUseCaseImpl implements RescanAssessmentUseCase {
  private readonly assessmentsStateMachine = inject(
    tokenAssessmentsStateMachine,
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  private async createAssessmentVersion(
    assessment: Assessment,
    createdBy: string,
  ): Promise<AssessmentVersion> {
    const newVersion = assessment.latestVersionNumber + 1;
    const assessmentVersion: AssessmentVersion = {
      assessmentId: assessment.id,
      version: newVersion,
      createdAt: new Date(),
      createdBy,
      pillars: assessment.pillars,
      executionArn: '',
    };
    await this.assessmentsRepository.createVersion({
      organizationDomain: assessment.organization,
      assessmentVersion,
    });
    await this.assessmentsRepository.update({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      assessmentBody: { latestVersionNumber: newVersion },
    });
    return assessmentVersion;
  }

  public async rescanAssessment(
    args: RescanAssessmentUseCaseArgs,
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.user.organizationDomain,
      });
    }

    await this.assessmentsStateMachine.cancelAssessment(
      assessment.executionArn,
    );

    const createdBy: string = args.user.id;
    const assessmentVersion = await this.createAssessmentVersion(
      assessment,
      createdBy,
    );

    const executionId = await this.assessmentsStateMachine.startAssessment({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
      createdAt: new Date(),
      createdBy,
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
    });

    await this.assessmentsRepository.updateVersion({
      assessmentId: args.assessmentId,
      version: assessmentVersion.version,
      organizationDomain: args.user.organizationDomain,
      assessmentVersionBody: {
        executionArn: executionId,
      },
    });

    this.logger.info(
      `Assessment#${args.assessmentId} rescan started successfully`,
    );
  }
}

export const tokenRescanAssessmentUseCase =
  createInjectionToken<RescanAssessmentUseCase>('RescanAssessmentUseCase', {
    useClass: RescanAssessmentUseCaseImpl,
  });
