import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware uniforme para validar y transformar entradas HTTP con Zod (DRY).
 * Si la validación falla, retorna HTTP 400 con los detalles de Zod.
 */
export function validateRequest(
  schemas: RequestValidationSchemas,
  errorMessage = 'Datos de entrada inválidos'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      if (schemas.params) {
        const parsedParams = (await schemas.params.parseAsync(req.params)) as Record<string, string>;
        req.params = parsedParams;
      }

      if (schemas.query) {
        const parsedQuery = (await schemas.query.parseAsync(req.query)) as typeof req.query;
        req.query = parsedQuery;
      }

      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: errorMessage,
          details: error.format(),
        });
      }
      return next(error);
    }
  };
}

