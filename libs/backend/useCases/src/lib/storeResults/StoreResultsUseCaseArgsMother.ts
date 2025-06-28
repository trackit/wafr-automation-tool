import { AIFindingAssociation } from '@backend/models';
import type { StoreResultsUseCaseArgs } from './StoreResultsUseCase';

export class StoreResultsUseCaseArgsMother {
  private data: StoreResultsUseCaseArgs;

  private constructor(data: StoreResultsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StoreResultsUseCaseArgsMother {
    return new StoreResultsUseCaseArgsMother({
      assessmentId: 'assessment_id',
      organization: 'organization',
      promptUri: 'prompt_uri',
      aiFindingAssociations: [],
    });
  }

  public withAssessmentId(assessmentId: string): StoreResultsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(organization: string): StoreResultsUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withPromptUri(promptUri: string): StoreResultsUseCaseArgsMother {
    this.data.promptUri = promptUri;
    return this;
  }

  public withAiAssociations(
    aiFindingAssociations: AIFindingAssociation[]
  ): StoreResultsUseCaseArgsMother {
    this.data.aiFindingAssociations = aiFindingAssociations;
    return this;
  }

  public build(): StoreResultsUseCaseArgs {
    return this.data;
  }
}
