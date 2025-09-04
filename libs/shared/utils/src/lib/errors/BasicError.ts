export const CATEGORIES = ['NOT_FOUND', 'FORBIDDEN', 'CONFLICT'] as const;

export type BasicErrorCategory = (typeof CATEGORIES)[number];
export type BasicErrorArgs = {
  code?: string;
  category: BasicErrorCategory;
  message: string;
  description?: string;
};

export abstract class BasicError extends Error {
  readonly code: string;
  readonly category: BasicErrorCategory;
  readonly description?: string;

  protected constructor(params: BasicErrorArgs) {
    super(params.message);

    Object.setPrototypeOf(this, new.target.prototype);
    const className = new.target.name;
    this.name = className;
    this.code = params.code ?? BasicError.deriveCodeFromClassName(className);
    this.category = params.category;
    this.description = params.description;
  }

  protected static deriveCodeFromClassName(className: string): string {
    const base = className.replace(/Error$/, '');
    return BasicError.toUpperSnake(base);
  }

  private static toUpperSnake(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .replace(/__+/g, '_')
      .toUpperCase();
  }
}
