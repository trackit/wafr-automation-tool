import { FindingComment } from './Finding';

export class FindingCommentMother {
  private data: FindingComment;

  private constructor(data: FindingComment) {
    this.data = data;
  }

  public static basic(): FindingCommentMother {
    return new FindingCommentMother({
      id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      authorId: 'author-id',
      text: 'comment-text',
      createdAt: new Date(),
    });
  }

  public withId(id: string): FindingCommentMother {
    this.data.id = id;
    return this;
  }

  public withAuthorId(authorId: string): FindingCommentMother {
    this.data.authorId = authorId;
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
