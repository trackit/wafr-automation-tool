import type { GetAssessmentVersionsUseCaseArgs as GetAssessmentVersionsUseCaseArgs } from './GetAssessmentVersionsUseCase';

export class GetAssessmentVersionsUseCaseArgsMother {
  private data: GetAssessmentVersionsUseCaseArgs;

  private constructor(data: GetAssessmentVersionsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentVersionsUseCaseArgsMother {
    return new GetAssessmentVersionsUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetAssessmentVersionsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetAssessmentVersionsUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withLimit(limit?: number): GetAssessmentVersionsUseCaseArgsMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken?: string,
  ): GetAssessmentVersionsUseCaseArgsMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public build(): GetAssessmentVersionsUseCaseArgs {
    return this.data;
  }
}
