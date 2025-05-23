export interface User {
  id: string;
  email: string;
  organizationDomain: string;
}

export class UserMother {
  private data: User;

  private constructor(data: User) {
    this.data = data;
  }

  public static basic(): UserMother {
    return new UserMother({
      id: 'user-id',
      email: 'user-id@test.io',
      organizationDomain: 'test.io',
    });
  }

  public withId(id: string): UserMother {
    this.data.id = id;
    return this;
  }

  public withEmail(email: string): UserMother {
    this.data.email = email;
    return this;
  }

  public withOrganizationDomain(organizationDomain: string): UserMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): User {
    return this.data;
  }
}
