import { User } from '@backend/models';
import type { GetAssessmentsUseCaseArgs } from './GetAssessmentsUseCase';

export class GetAssessmentsUseCaseArgsMother {
  private data: GetAssessmentsUseCaseArgs;

  private constructor(data: GetAssessmentsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentsUseCaseArgsMother {
    return new GetAssessmentsUseCaseArgsMother({
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withLimit(limit?: number): GetAssessmentsUseCaseArgsMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(nextToken?: string): GetAssessmentsUseCaseArgsMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public withSearch(search?: string): GetAssessmentsUseCaseArgsMother {
    this.data.search = search;
    return this;
  }

  public withUser(user: User): GetAssessmentsUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): GetAssessmentsUseCaseArgs {
    return this.data;
  }
}
