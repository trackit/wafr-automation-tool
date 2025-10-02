import { tokenAssessmentsRepository } from '@backend/infrastructure';
import {
  AssessmentFileExport,
  AssessmentFileExportType,
  User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type ListPDFExportsUseCaseArgs = {
  user: User;
  assessmentId: string;
};

export interface ListPDFExportsUseCase {
  listPDFExports(
    args: ListPDFExportsUseCaseArgs,
  ): Promise<AssessmentFileExport[]>;
}

export class ListPDFExportsUseCaseImpl implements ListPDFExportsUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async listPDFExports(
    args: ListPDFExportsUseCaseArgs,
  ): Promise<AssessmentFileExport[]> {
    const { assessmentId, user } = args;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain: user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain: user.organizationDomain,
      });
    }

    const fileExports = assessment.fileExports?.[AssessmentFileExportType.PDF];
    if (!fileExports) {
      return [];
    }
    return fileExports.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

export const tokenListPDFExportsUseCase =
  createInjectionToken<ListPDFExportsUseCase>('ListPDFExportsUseCase', {
    useClass: ListPDFExportsUseCaseImpl,
  });
