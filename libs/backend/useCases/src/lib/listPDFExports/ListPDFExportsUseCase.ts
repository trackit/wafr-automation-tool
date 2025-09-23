import { tokenAssessmentsRepository } from '@backend/infrastructure';
import {
  AssessmentFileExport,
  AssessmentFileExportType,
  User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { NotFoundError } from '../Errors';

export type ListPDFExportsUseCaseArgs = {
  user: User;
  assessmentId: string;
};

export interface ListPDFExportsUseCase {
  listPDFExports(
    args: ListPDFExportsUseCaseArgs
  ): Promise<AssessmentFileExport[]>;
}

export class ListPDFExportsUseCaseImpl implements ListPDFExportsUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async listPDFExports({
    assessmentId,
    user,
  }: ListPDFExportsUseCaseArgs): Promise<AssessmentFileExport[]> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organization: user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${user.organizationDomain}`
      );
    }

    const fileExports = assessment.fileExports?.[AssessmentFileExportType.PDF];
    if (!fileExports) {
      return [];
    }
    return fileExports.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const tokenListPDFExportsUseCase =
  createInjectionToken<ListPDFExportsUseCase>('ListPDFExportsUseCase', {
    useClass: ListPDFExportsUseCaseImpl,
  });
