/*
    *  -----------------------------------------------------------------------  *
    *  -----  requireAuth.ts  --  /server/src/middleware/requireAuth.ts  -----  *
    *  -----------------------------------------------------------------------  *
*/
import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../services/auth.service.js';
import type { AuthUser } from '../types/types.js';

export const SESSION_COOKIE_NAME = 'sid';

declare global {
    namespace Express {
        interface Request {
            authUser?: AuthUser;
        }
    }
}

/**
 * ------------------------------
 * -----  `parseCookies()`  -----
 * ------------------------------
 * - Extrae las cookies de la cabecera Cookie sin librerías externas.
 */
const parseCookies = (header: string | undefined): Record<string, string> => {
    const result: Record<string, string> = {};

    //  -----  sin cabecera de cookies, no hay nada que parsear  -----
    if (!header) {
        return result;
    }

    for (const part of header.split(';')) {
        const separator = part.indexOf('=');
        if (separator === -1) {
            continue;
        }

        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        if (!key) {
            continue;
        }

        try {
            result[key] = decodeURIComponent(value);
        }
        catch {
            //  -----  valor con encoding inválido: ignorar la cookie  -----
        }
    }

    return result;
};

/**
 * -------------------------------
 * -----  `requireAuth()`  -----
 * -------------------------------
 * - Exige una sesión válida; si no la hay responde 401.
 */
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];

    //  -----  sin cookie de sesión, no autorizado  -----
    if (!token) {
        res.status(401).json({ error: 'No autorizado' });
        return;
    }

    let user: AuthUser | undefined;
    try {
        user = await authenticate(token);
    }
    catch (error) {
        console.error('Error al autenticar la sesión:', error);
        res.status(500).json({ error: 'Error interno al validar la sesión' });
        return;
    }

    //  -----  sesión inexistente o expirada, no autorizado  -----
    if (!user) {
        res.status(401).json({ error: 'No autorizado' });
        return;
    }

    req.authUser = user;
    next();
};
