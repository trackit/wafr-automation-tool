import type { InvokeLLMUseCaseArgs } from './InvokeLLMUseCase';

export class InvokeLLMUseCaseArgsMother {
  private data: InvokeLLMUseCaseArgs;

  private constructor(data: InvokeLLMUseCaseArgs) {
    this.data = data;
  }

  public static basic(): InvokeLLMUseCaseArgsMother {
    return new InvokeLLMUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      promptArn: 'prompt-arn',
      promptUri: 'prompt-uri',
    });
  }

  public withAssessmentId(assessment_id: string): InvokeLLMUseCaseArgsMother {
    this.data.assessmentId = assessment_id;
    return this;
  }

  public withOrganization(organization: string): InvokeLLMUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withPromptArn(prompt_arn: string): InvokeLLMUseCaseArgsMother {
    this.data.promptArn = prompt_arn;
    return this;
  }

  public withPromptUri(prompt_uri: string): InvokeLLMUseCaseArgsMother {
    this.data.promptUri = prompt_uri;
    return this;
  }

  public build(): InvokeLLMUseCaseArgs {
    return this.data;
  }
}
