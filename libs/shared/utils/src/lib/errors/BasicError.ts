export enum BasicErrorType {
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
}

export type BasicErrorArgs = {
  code?: string;
  type: BasicErrorType;
  message: string;
  description?: string;
};

export abstract class BasicError extends Error {
  readonly code: string;
  readonly type: BasicErrorType;
  readonly description?: string;

  protected constructor(params: BasicErrorArgs) {
    super(params.message);

    // Keep the prototype chain pointing at the subclass so instanceof works
    Object.setPrototypeOf(this, new.target.prototype);
    // Capture the concrete class name to surface it in the error payload
    const className = new.target.name;
    this.name = className;
    this.code = params.code ?? BasicError.deriveCodeFromClassName(className);
    this.type = params.type;
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
