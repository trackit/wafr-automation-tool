import { type GetOrganizationUseCaseArgs } from './GetOrganizationUseCase';

export class GetOrganizationUseCaseArgsMother {
  private data: GetOrganizationUseCaseArgs;

  private constructor(data: GetOrganizationUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetOrganizationUseCaseArgsMother {
    return new GetOrganizationUseCaseArgsMother({
      organizationDomain: 'test.io',
    });
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetOrganizationUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetOrganizationUseCaseArgs {
    return this.data;
  }
}
