import { UseCaseError } from './UseCaseError';

export class PillarNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      pillarId: string;
    },
    description?: string
  ) {
    const { assessmentId, organizationDomain, pillarId } = args;
    super({
      type: 'NOT_FOUND',
      message: `Pillar with id ${pillarId} not found for assessment with id ${assessmentId} for organization with domain ${organizationDomain}`,
      description,
    });
  }
}
