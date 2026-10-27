import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role, User } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware de autenticación simple para la prueba técnica.
 * Acepta x-user-id o x-user-email en los headers, o usa un fallback seguro.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userIdHeader = req.headers['x-user-id'];
  const userEmailHeader = req.headers['x-user-email'];

  try {
    let user: User | null = null;

    if (userIdHeader) {
      const parsedId = parseInt(String(userIdHeader), 10);
      if (!isNaN(parsedId)) {
        user = await prisma.user.findUnique({ where: { id: parsedId } });
      }
    } else if (userEmailHeader) {
      user = await prisma.user.findUnique({ where: { email: String(userEmailHeader) } });
    }

    if (!user) {
      return res.status(401).json({
        error: 'No autenticado. Por favor proporcione header x-user-id (ej. 2 para admin) o x-user-email.',
      });
    }

    req.user = user;
    return next();
  } catch (error: any) {
    return res.status(500).json({ error: 'Error durante la autenticación', details: error.message });
  }
}

/**
 * Middleware de autorización que exige un rol específico (ej. ADMIN).
 */
export function requireRole(role: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Acceso denegado: se requiere rol ${role}. El usuario actual tiene rol ${req.user.role}.`,
      });
    }

    return next();
  };
}

