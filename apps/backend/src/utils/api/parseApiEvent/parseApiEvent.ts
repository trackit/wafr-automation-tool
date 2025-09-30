import type { APIGatewayProxyEvent } from 'aws-lambda';
import z, { ZodError, type ZodType } from 'zod';

import { JSONParseError, parseJsonObject } from '@shared/utils';

import {
  BodyMissingError,
  ParametersJSONParseError,
  ParametersValidationError,
  PathMissingError,
  QueryMissingError,
} from '../../../errors';

function acceptsEmptyObject<T>(schema: ZodType<T>): boolean {
  return schema.safeParse({}).success;
}

export function parsePathFromEvent<P>(
  event: APIGatewayProxyEvent,
  schema: ZodType<P>,
): P {
  const raw = event.pathParameters ?? undefined;
  if (raw == null) {
    throw new PathMissingError();
  }
  return schema.parse(raw);
}

export function parseQueryFromEvent<Q>(
  event: APIGatewayProxyEvent,
  schema: ZodType<Q>,
): Q {
  const raw = event.queryStringParameters ?? undefined;
  if (raw == null) {
    if (acceptsEmptyObject(schema)) {
      return schema.parse({});
    }
    throw new QueryMissingError();
  }
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v != null),
  );
  return schema.parse(cleaned);
}

export function parseBodyFromEvent<B>(
  event: APIGatewayProxyEvent,
  schema: ZodType<B>,
): B {
  const rawBody =
    event.body == null || event.body === '{}'
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;

  if (rawBody == null) {
    throw new BodyMissingError();
  }

  return schema.parse(parseJsonObject(rawBody));
}

type InferOrUndefined<S extends ZodType | undefined> = S extends ZodType
  ? z.infer<S>
  : undefined;

export function parseApiEvent<
  P extends ZodType | undefined,
  Q extends ZodType | undefined,
  B extends ZodType | undefined,
>(
  event: APIGatewayProxyEvent,
  schemas: { pathSchema?: P; querySchema?: Q; bodySchema?: B },
): {
  pathParameters: InferOrUndefined<P>;
  queryStringParameters: InferOrUndefined<Q>;
  body: InferOrUndefined<B>;
} {
  try {
    const pathParameters = schemas.pathSchema
      ? parsePathFromEvent(event, schemas.pathSchema)
      : undefined;
    const queryStringParameters = schemas.querySchema
      ? parseQueryFromEvent(event, schemas.querySchema)
      : undefined;
    const body = schemas.bodySchema
      ? parseBodyFromEvent(event, schemas.bodySchema)
      : undefined;

    return {
      pathParameters: pathParameters as InferOrUndefined<P>,
      queryStringParameters: queryStringParameters as InferOrUndefined<Q>,
      body: body as InferOrUndefined<B>,
    };
  } catch (e) {
    if (e instanceof ZodError) {
      throw new ParametersValidationError(e);
    } else if (e instanceof JSONParseError) {
      throw new ParametersJSONParseError(e.message);
    }
    throw e;
  }
}
