import { UseCaseError } from './UseCaseError';

export class OrganizationNotFoundError extends UseCaseError {
  public constructor(
    args: {
      organization: string;
    },
    description?: string
  ) {
    const { organization } = args;
    super({
      category: 'NOT_FOUND',
      message: `Organization with domain ${organization} not found`,
      description,
    });
  }
}

export class OrganizationSubscriptionNotFoundError extends UseCaseError {
  public constructor(
    args: {
      organization: string;
    },
    description?: string
  ) {
    const { organization } = args;
    super({
      category: 'NOT_FOUND',
      message: `Organization with domain ${organization} does not have a subscription`,
      description,
    });
  }
}

export class OrganizationExportRoleNotSetError extends UseCaseError {
  public constructor(
    args: {
      organization: string;
    },
    description?: string
  ) {
    const { organization } = args;
    super({
      category: 'CONFLICT',
      message: `Organization with domain ${organization} has no export role set`,
      description,
    });
  }
}

export class OrganizationNoActiveSubscriptionError extends UseCaseError {
  public constructor(
    args: {
      organization: string;
    },
    description?: string
  ) {
    const { organization } = args;
    super({
      category: 'FORBIDDEN',
      message: `Organization with domain ${organization} does not have an active subscription or free assessments left`,
      description,
    });
  }
}
