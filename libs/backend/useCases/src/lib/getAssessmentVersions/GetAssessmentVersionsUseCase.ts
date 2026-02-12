import {
  tokenAssessmentsRepository,
  tokenCognitoService,
} from '@backend/infrastructure';
import type { AssessmentVersion } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export interface GetAssessmentVersionsUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  limit?: number;
  nextToken?: string;
}

export interface GetAssessmentVersionsUseCase {
  getAssessmentVersions(args: GetAssessmentVersionsUseCaseArgs): Promise<{
    versions: AssessmentVersion[];
    nextToken?: string;
  }>;
}

export class GetAssessmentVersionsUseCaseImpl
  implements GetAssessmentVersionsUseCase
{
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly cognitoService = inject(tokenCognitoService);

  public async getAssessmentVersions(
    args: GetAssessmentVersionsUseCaseArgs,
  ): Promise<{
    versions: AssessmentVersion[];
    nextToken?: string;
  }> {
    const { organizationDomain, assessmentId, limit, nextToken } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }

    const result = await this.assessmentsRepository.getAllVersions({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      limit,
      nextToken,
    });

    const versions = result.assessmentVersions;
    const createdByIds = Array.from(
      new Set(versions.map((v) => v.createdBy).filter(Boolean)),
    );

    const users = (
      await Promise.all(
        createdByIds.map((userId) => {
          return this.cognitoService.getUserById({ userId }).catch(() => null);
        }),
      )
    ).filter(Boolean) as { id: string; email: string }[];

    const userById = new Map(users.map((u) => [u.id, u.email]));

    const versionsWithCreatedBy = versions.map((version) => ({
      ...version,
      createdBy: userById.get(version.createdBy) ?? version.createdBy,
    }));

    return {
      versions: versionsWithCreatedBy,
      nextToken: result.nextToken,
    };
  }
}

export const tokenGetAssessmentVersionsUseCase =
  createInjectionToken<GetAssessmentVersionsUseCase>(
    'GetAssessmentVersionsUseCase',
    {
      useClass: GetAssessmentVersionsUseCaseImpl,
    },
  );
