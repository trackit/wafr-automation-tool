import {
  tokenAssessmentsRepository,
  tokenIdGenerator,
  tokenLambdaService,
  tokenLogger,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentStep,
  User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import {
  AssessmentFileExportAlreadyExistsError,
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
} from '../../errors';

export type StartPDFExportUseCaseArgs = {
  user: User;
  assessmentId: string;
  versionName: string;
};

export interface StartPDFExportUseCase {
  startPDFExport(args: StartPDFExportUseCaseArgs): Promise<void>;
}

export class StartPDFExportUseCaseImpl implements StartPDFExportUseCase {
  private readonly logger = inject(tokenLogger);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly lambdaService = inject(tokenLambdaService);
  private readonly lambdaStartPDFExportArn = inject(
    tokenStartPDFExportLambdaArn,
  );

  public async startPDFExport(args: StartPDFExportUseCaseArgs): Promise<void> {
    const { assessmentId, user, versionName } = args;

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
    if (
      !assessment.pillars ||
      assessment.pillars.length === 0 ||
      assessment.step !== AssessmentStep.FINISHED
    ) {
      throw new AssessmentNotFinishedError({ assessmentId: assessment.id });
    }
    if (!assessment.fileExports) {
      assessment.fileExports = {
        [AssessmentFileExportType.PDF]: [],
      };

      await this.assessmentsRepository.update({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        assessmentBody: {
          fileExports: assessment.fileExports,
        },
      });
    }

    const foundAssessmentExport = assessment.fileExports[
      AssessmentFileExportType.PDF
    ]?.find((assessmentExport) => assessmentExport.versionName === versionName);
    if (foundAssessmentExport) {
      throw new AssessmentFileExportAlreadyExistsError({
        assessmentId: assessment.id,
        fileExportType: AssessmentFileExportType.PDF,
        versionName,
      });
    }

    const fileExport = AssessmentFileExportMother.basic()
      .withId(this.idGenerator.generate())
      .withStatus(AssessmentFileExportStatus.NOT_STARTED)
      .withVersionName(versionName)
      .withCreatedAt(new Date())
      .build();
    await this.assessmentsRepository.updateFileExport({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      type: AssessmentFileExportType.PDF,
      data: fileExport,
    });

    await this.lambdaService.asyncInvokeLambda({
      lambdaArn: this.lambdaStartPDFExportArn,
      payload: JSON.stringify({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        fileExportId: fileExport.id,
      }),
    });
    this.logger.info(`PDF file export for assessment ${assessment.id} started`);
  }
}

export const tokenStartPDFExportUseCase =
  createInjectionToken<StartPDFExportUseCase>('StartPDFExportUseCase', {
    useClass: StartPDFExportUseCaseImpl,
  });

export const tokenStartPDFExportLambdaArn = createInjectionToken<string>(
  'StartPDFExportLambdaArn',
  {
    useFactory: () => {
      const lambdaArn = process.env.PDF_EXPORT_LAMBDA_ARN;
      assertIsDefined(lambdaArn, 'PDF_EXPORT_LAMBDA_ARN is not defined');
      return lambdaArn;
    },
  },
);
