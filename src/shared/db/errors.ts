export class NotFoundError extends Error {
  constructor(
    public entity: string,
    public id?: string,
  ) {
    super(`${entity}${id ? ` ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UniqueConstraintError extends Error {
  constructor(public field: string) {
    super(`Unique constraint violated on ${field}`);
    this.name = 'UniqueConstraintError';
  }
}
