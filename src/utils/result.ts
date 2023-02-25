export type Result<T, E extends Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly value: T;
  readonly success = true;
  readonly failure = false;

  constructor(value: T) {
    this.value = value;
  }
  get() {
    return this.value;
  }
}

export class Failure<E extends Error> {
  readonly error: E;
  readonly success = false;
  readonly failure = true;

  constructor(error: E) {
    this.error = error;
  }

  get() {
    throw this.error;
    return null;
  }
}
