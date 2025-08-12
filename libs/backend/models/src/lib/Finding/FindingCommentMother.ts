import { FindingComment } from './Finding';

export class FindingCommentMother {
  private data: FindingComment;

  private constructor(data: FindingComment) {
    this.data = data;
  }

  public static basic(): FindingCommentMother {
    return new FindingCommentMother({
      id: 'comment-id',
      author: 'author-id',
      text: 'comment-text',
      createdAt: new Date(),
    });
  }

  public withId(id: string): FindingCommentMother {
    this.data.id = id;
    return this;
  }

  public withAuthor(author: string): FindingCommentMother {
    this.data.author = author;
    return this;
  }

  public withText(text: string): FindingCommentMother {
    this.data.text = text;
    return this;
  }

  public withCreatedAt(createdAt: Date): FindingCommentMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public build(): FindingComment {
    return this.data;
  }
}
