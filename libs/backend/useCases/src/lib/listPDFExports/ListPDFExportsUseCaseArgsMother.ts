import { User, UserMother } from '@backend/models';

import { ListPDFExportsUseCaseArgs } from './ListPDFExportsUseCase';

export class ListPDFExportsUseCaseArgsMother {
  private data: ListPDFExportsUseCaseArgs;

  private constructor(data: ListPDFExportsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): ListPDFExportsUseCaseArgsMother {
    return new ListPDFExportsUseCaseArgsMother({
      user: UserMother.basic().build(),
      assessmentId: 'assessment-id',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): ListPDFExportsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): ListPDFExportsUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): ListPDFExportsUseCaseArgs {
    return this.data;
  }
}
