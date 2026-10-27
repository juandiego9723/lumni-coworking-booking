import { Response } from 'express';

/**
 * Manejador estándar de errores HTTP para controladores de Express.
 * Evita duplicación de código (DRY) y garantiza tipado estricto sin 'any'.
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  defaultMessage = 'Error interno del servidor',
  overrideStatus?: number
): Response {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;

  if (overrideStatus) {
    return res.status(overrideStatus).json({ error: errorMessage });
  }

  const isNotFound = errorMessage.includes('no encontrada') || errorMessage.includes('no existe') || errorMessage.includes('no encontrado');
  const isConflict = errorMessage.includes('acaba de ser reservado');
  const isBadRequest =
    errorMessage.includes('inválid') ||
    errorMessage.includes('obligatorio') ||
    errorMessage.includes('cerrado') ||
    errorMessage.includes('Solo se pueden modificar borradores') ||
    errorMessage.includes('Transición de estado inválida') ||
    errorMessage.includes('No se puede cancelar') ||
    errorMessage.includes('ya se encuentra cancelada');

  const status = isNotFound ? 404 : isConflict ? 409 : isBadRequest ? 400 : 500;

  return res.status(status).json({ error: errorMessage });
}

