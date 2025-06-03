import { User } from '@backend/models';
import type { GetAllAssessmentsUseCaseArgs } from './GetAllAssessmentsUseCase';

export class GetAllAssessmentsUseCaseArgsMother {
  private data: GetAllAssessmentsUseCaseArgs;

  private constructor(data: GetAllAssessmentsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAllAssessmentsUseCaseArgsMother {
    return new GetAllAssessmentsUseCaseArgsMother({
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withLimit(limit?: number): GetAllAssessmentsUseCaseArgsMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(nextToken?: string): GetAllAssessmentsUseCaseArgsMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public withSearch(search?: string): GetAllAssessmentsUseCaseArgsMother {
    this.data.search = search;
    return this;
  }

  public withUser(user: User): GetAllAssessmentsUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): GetAllAssessmentsUseCaseArgs {
    return this.data;
  }
}
