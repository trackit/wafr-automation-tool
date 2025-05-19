export function assertIsDefined<T>(
  val: T,
  msg?: string
): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(
      JSON.stringify({
        message: `Expected 'val' to be defined, but received ${val}${
          msg ? ` (${msg})` : ''
        }`,
      })
    );
  }
}
