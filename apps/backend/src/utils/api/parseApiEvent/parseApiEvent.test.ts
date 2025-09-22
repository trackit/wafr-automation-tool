import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  BodyMissingError,
  ParametersJSONParseError,
  ParametersValidationError,
  PathMissingError,
  QueryMissingError,
} from '../../../errors';
import { APIGatewayProxyEventMother } from '../APIGatewayProxyEventMother';
import {
  parseApiEvent,
  parseBodyFromEvent,
  parsePathFromEvent,
  parseQueryFromEvent,
} from './parseApiEvent';

describe('parseApiEvent', () => {
  describe('parsePathFromEvent', () => {
    it('should parse required path when present', () => {
      const schema = z.object({ assessmentId: z.string().uuid() });
      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .build();

      const parsed = parsePathFromEvent(event, schema);
      expect(parsed).toEqual({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should throw PathMissingError when required path is missing', () => {
      const schema = z.object({ assessmentId: z.string().uuid() });
      const event = APIGatewayProxyEventMother.basic().build();

      expect(() => parsePathFromEvent(event, schema)).toThrow(PathMissingError);
    });
  });

  describe('parseQueryFromEvent', () => {
    it('should parse query and strip unknown keys', () => {
      const schema = z.object({ page: z.string(), q: z.string().optional() });
      const event = APIGatewayProxyEventMother.basic()
        .withQueryStringParameters({ page: '2', q: 'hello', extra: 'ignored' })
        .build();

      const parsed = parseQueryFromEvent(event, schema);
      expect(parsed).toEqual({ page: '2', q: 'hello' });
      expect(Object.prototype.hasOwnProperty.call(parsed, 'extra')).toBe(false);
    });

    it('should throw QueryMissingError when required query is missing', () => {
      const schema = z.object({ page: z.string() });
      const event = APIGatewayProxyEventMother.basic().build();

      expect(() => parseQueryFromEvent(event, schema)).toThrow(
        QueryMissingError
      );
    });

    it('should treat missing query as {} when object query schema allows empty', () => {
      const schema = z.object({ page: z.string().optional() });
      const event = APIGatewayProxyEventMother.basic().build();

      const parsed = parseQueryFromEvent(event, schema);
      expect(parsed).toEqual({});
    });
  });

  describe('parseBodyFromEvent', () => {
    it('should parse a JSON body (non-base64)', () => {
      const schema = z.object({
        name: z.string(),
        region: z.string().optional(),
      });
      const event = APIGatewayProxyEventMother.basic()
        .withBody(JSON.stringify({ name: 'alice' }))
        .build();

      const parsed = parseBodyFromEvent(event, schema);
      expect(parsed).toEqual({ name: 'alice' });
    });

    it('should parse a JSON body (base64-encoded)', () => {
      const schema = z.object({ name: z.string() });
      const payload = Buffer.from(
        JSON.stringify({ name: 'bob' }),
        'utf8'
      ).toString('base64');
      const event = APIGatewayProxyEventMother.basic()
        .withBody(payload)
        .build();
      event.isBase64Encoded = true;

      const parsed = parseBodyFromEvent(event, schema);
      expect(parsed).toEqual({ name: 'bob' });
    });

    it('should throw BodyMissingError when required body is missing', () => {
      const schema = z.object({ name: z.string() });
      const event = APIGatewayProxyEventMother.basic().build();

      expect(() => parseBodyFromEvent(event, schema)).toThrow(BodyMissingError);
    });

    it('should throw BodyMissingError when required body is empty', () => {
      const schema = z.object({ name: z.string() });
      const event = APIGatewayProxyEventMother.basic().withBody('{}').build();

      expect(() => parseBodyFromEvent(event, schema)).toThrow(BodyMissingError);
    });
  });

  describe('integration', () => {
    const PathSchema = z.object({ assessmentId: z.string().uuid() });
    const BodySchema = z.object({
      name: z.string(),
      region: z.string().optional(),
    });

    it('should parse path and body and return typed values', () => {
      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .withBody(JSON.stringify({ name: 'alice', region: 'eu-west-1' }))
        .build();

      const { pathParameters, body } = parseApiEvent(event, {
        pathSchema: PathSchema,
        bodySchema: BodySchema,
      });

      expect(pathParameters).toEqual({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(body).toEqual({ name: 'alice', region: 'eu-west-1' });
    });

    it('should wrap ZodError as ParametersValidationError', () => {
      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .withBody(JSON.stringify({ name: 42 }))
        .build();

      expect(() =>
        parseApiEvent(event, { pathSchema: PathSchema, bodySchema: BodySchema })
      ).toThrow(ParametersValidationError);
    });

    it('should throw ParametersJSONParseError when body is not a valid JSON', () => {
      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .withBody('{"name":')
        .build();

      expect(() =>
        parseApiEvent(event, { pathSchema: PathSchema, bodySchema: BodySchema })
      ).toThrow(ParametersJSONParseError);
    });

    it('should propagate all MissingError when required segments are absent', () => {
      const event = APIGatewayProxyEventMother.basic().build();

      expect(() => parseApiEvent(event, { pathSchema: PathSchema })).toThrow(
        PathMissingError
      );

      expect(() => parseApiEvent(event, { bodySchema: BodySchema })).toThrow(
        BodyMissingError
      );

      const QuerySchema = z.object({ q: z.string() });
      expect(() => parseApiEvent(event, { querySchema: QuerySchema })).toThrow(
        QueryMissingError
      );
    });
  });
});
