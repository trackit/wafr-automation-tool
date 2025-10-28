import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class OrganizationNotFoundError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Organization with domain ${domain} not found`,
      description,
    });
  }
}

export class OrganizationSubscriptionNotFoundError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Organization with domain ${domain} does not have a subscription`,
      description,
    });
  }
}

export class OrganizationExportRoleNotSetError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Organization with domain ${domain} has no export role set`,
      description,
    });
  }
}

export class OrganizationNoActiveSubscriptionError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.FORBIDDEN,
      message: `Organization with domain ${domain} does not have an active subscription or free assessments left`,
      description,
    });
  }
}

export class OrganizationAccountIdNotSetError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Organization with domain ${domain} has no account ID set`,
      description,
    });
  }
}

export class OrganizationUnitBasedAgreementIdNotSetError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Organization with domain ${domain} has no unit-based agreement ID set`,
      description,
    });
  }
}

export class OrganizationAceDetailsNotFoundError extends UseCaseError {
  public constructor(
    args: {
      domain: string;
    },
    description?: string,
  ) {
    const { domain } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `No ace details found for organization ${domain}`,
      description,
    });
  }
}
