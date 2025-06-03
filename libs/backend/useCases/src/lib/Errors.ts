export class ServerError extends Error {
  public readonly description?: string;

  public constructor({
    message,
    description,
    name = 'ServerError',
  }: {
    message: string;
    name?: string;
    description?: string;
  }) {
    super(message);
    this.description = description;
    this.name = name;
  }
}

export class NotFoundError extends ServerError {
  public constructor(description?: string) {
    super({
      message: 'Not Found',
      name: 'NotFoundError',
      description,
    });
  }
}
