import { IdGenerator } from '@backend/ports';

export class FakeIdGenerator implements IdGenerator {
  private id = 0;

  generate(): string {
    return `fake-id-${this.id++}`;
  }
}
