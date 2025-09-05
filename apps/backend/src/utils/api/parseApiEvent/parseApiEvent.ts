import type { APIGatewayProxyEvent } from 'aws-lambda';
import { z, ZodError, type ZodTypeAny } from 'zod';

import { JSONParseError, parseJsonObject } from '@shared/utils';

import {
  BodyMissingError,
  ParametersJSONParseError,
  ParametersValidationError,
  PathMissingError,
  QueryMissingError,
} from '../../../errors';

function acceptsUndefined(schema: ZodTypeAny): boolean {
  return schema.safeParse(undefined).success;
}

function acceptsEmptyObject(schema: ZodTypeAny): boolean {
  return schema.safeParse({}).success;
}

export function parsePathFromEvent<P extends ZodTypeAny>(
  event: APIGatewayProxyEvent,
  schema: P
): z.infer<P> {
  const raw = event.pathParameters ?? undefined;
  if (raw == null) {
    if (acceptsUndefined(schema)) {
      return schema.parse(undefined) as z.infer<P>;
    }
    if (acceptsEmptyObject(schema)) {
      return schema.parse({}) as z.infer<P>;
    }
    throw new PathMissingError();
  }
  return schema.parse(raw) as z.infer<P>;
}

export function parseQueryFromEvent<Q extends ZodTypeAny>(
  event: APIGatewayProxyEvent,
  schema: Q
): z.infer<Q> {
  const raw = event.queryStringParameters ?? undefined;
  if (raw == null) {
    if (acceptsUndefined(schema)) {
      return schema.parse(undefined) as z.infer<Q>;
    }
    if (acceptsEmptyObject(schema)) {
      return schema.parse({}) as z.infer<Q>;
    }
    throw new QueryMissingError();
  }
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v != null)
  );
  return schema.parse(cleaned) as z.infer<Q>;
}

export function parseBodyFromEvent<B extends ZodTypeAny>(
  event: APIGatewayProxyEvent,
  schema: B
): z.infer<B> {
  const rawBody =
    event.body == null
      ? undefined
      : event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;

  if (rawBody == null) {
    if (acceptsUndefined(schema)) {
      return schema.parse(undefined) as z.infer<B>;
    }
    if (acceptsEmptyObject(schema)) {
      return schema.parse({}) as z.infer<B>;
    }
    throw new BodyMissingError();
  }

  return schema.parse(parseJsonObject(rawBody)) as z.infer<B>;
}

type InferOrUndef<S extends ZodTypeAny | undefined> = S extends ZodTypeAny
  ? z.infer<S>
  : undefined;

export function parseApiEvent<
  P extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined,
  B extends ZodTypeAny | undefined
>(
  event: APIGatewayProxyEvent,
  schemas: { pathSchema?: P; querySchema?: Q; bodySchema?: B }
): {
  pathParameters: InferOrUndef<P>;
  queryStringParameters: InferOrUndef<Q>;
  body: InferOrUndef<B>;
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
      pathParameters: pathParameters as InferOrUndef<P>,
      queryStringParameters: queryStringParameters as InferOrUndef<Q>,
      body: body as InferOrUndef<B>,
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
