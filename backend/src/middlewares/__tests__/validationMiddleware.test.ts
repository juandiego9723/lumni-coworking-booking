import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../validationMiddleware';

describe('Validation Middleware (Consistency & DRY)', () => {
  const dummyBodySchema = z.object({
    name: z.string().min(3),
    age: z.number().positive(),
  });

  const dummyParamSchema = z.object({
    id: z.coerce.number().positive(),
  });

  function createMockContext(reqPartial: Partial<Request> = {}) {
    const req = {
      body: {},
      params: {},
      query: {},
      ...reqPartial,
    } as Request;

    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as NextFunction;

    return { req, res, next, status, json };
  }

  it('calls next() when body is valid', async () => {
    const { req, res, next } = createMockContext({
      body: { name: 'Carlos', age: 30 },
    });

    const middleware = validateRequest({ body: dummyBodySchema });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with details when body validation fails', async () => {
    const { req, res, next, status, json } = createMockContext({
      body: { name: 'Al', age: -5 },
    });

    const middleware = validateRequest({ body: dummyBodySchema });
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Datos de entrada inválidos',
        details: expect.any(Object),
      })
    );
  });

  it('validates and coerces string params into numbers', async () => {
    const { req, res, next } = createMockContext({
      params: { id: '42' as unknown as string } as Record<string, string>,
    });

    const middleware = validateRequest({ params: dummyParamSchema });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req.params as Record<string, unknown>).id).toBe(42);
  });

  it('rejects invalid params with 400', async () => {
    const { req, res, next, status, json } = createMockContext({
      params: { id: 'no-es-numero' } as Record<string, string>,
    });

    const middleware = validateRequest({ params: dummyParamSchema });
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
  });

  it('uses custom error message when provided', async () => {
    const { req, res, next, status, json } = createMockContext({
      body: {},
    });

    const middleware = validateRequest({ body: dummyBodySchema }, 'Cuerpo inválido');
    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Cuerpo inválido',
      })
    );
  });
});
