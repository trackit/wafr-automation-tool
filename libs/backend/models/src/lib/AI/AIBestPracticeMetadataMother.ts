import { AIBestPracticeMetadata } from './AI';

export class AIBestPracticeMetadataMother {
  private data: AIBestPracticeMetadata;

  private constructor(data: AIBestPracticeMetadata) {
    this.data = data;
  }

  public static basic(): AIBestPracticeMetadataMother {
    return new AIBestPracticeMetadataMother({
      id: 1,
      pillarLabel: 'pillar-label',
      questionLabel: 'question-label',
      bestPracticeLabel: 'best-practice-label',
      bestPracticeDescription: 'best-practice-description',
    });
  }

  public withId(id: number): AIBestPracticeMetadataMother {
    this.data.id = id;
    return this;
  }

  public withPillarLabel(pillarLabel: string): AIBestPracticeMetadataMother {
    this.data.pillarLabel = pillarLabel;
    return this;
  }

  public withQuestionLabel(
    questionLabel: string
  ): AIBestPracticeMetadataMother {
    this.data.questionLabel = questionLabel;
    return this;
  }

  public withBestPracticeLabel(
    bestPracticeLabel: string
  ): AIBestPracticeMetadataMother {
    this.data.bestPracticeLabel = bestPracticeLabel;
    return this;
  }

  public withBestPracticeDescription(
    bestPracticeDescription: string
  ): AIBestPracticeMetadataMother {
    this.data.bestPracticeDescription = bestPracticeDescription;
    return this;
  }

  public build(): AIBestPracticeMetadata {
    return this.data;
  }
}
