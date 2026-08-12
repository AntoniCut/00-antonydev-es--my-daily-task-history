/*
    *  --------------------------------------------------------------------------------  *
    *  -----  auth.controller.ts  --  /server/src/controllers/auth.controller.ts  -----  *
    *  --------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../middleware/requireAuth.js';
import {
    authenticate,
    login as loginService,
    logout as logoutService,
    SESSION_TTL_MS,
} from '../services/auth.service.js';
import type { AuthUser, LoginDto } from '../types/types.js';

const MAX_LOGIN_FAILS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

interface AttemptRecord {
    fails: number;
    blockedUntil: number;
}

/** Intentos de login fallidos por IP, en memoria. */
const attempts = new Map<string, AttemptRecord>();

/**
 * ------------------------------
 * -----  `cookieOptions()`  -----
 * ------------------------------
 * - Opciones de la cookie de sesión (httpOnly, 7 días, Secure en producción).
 */
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS,
    secure: process.env.NODE_ENV === 'production',
});

/**
 * -------------------------------
 * -----  `publicUser()`  -----
 * -------------------------------
 * - Expone solo los campos seguros del usuario autenticado.
 */
const publicUser = (user: AuthUser): { id: string; username: string; createdAt: string } => ({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
});

/**
 * ---------------------------
 * -----  `isBlocked()`  -----
 * ---------------------------
 * - Indica si la IP está bloqueada por exceso de intentos fallidos.
 */
const isBlocked = (ip: string): boolean => {
    const record = attempts.get(ip);

    //  -----  si no hay registro o el bloqueo expiró, no está bloqueada  -----
    if (!record || record.blockedUntil < Date.now()) {
        attempts.delete(ip);
        return false;
    }

    return true;
};

/**
 * ------------------------------
 * -----  `registerFail()`  -----
 * ------------------------------
 * - Registra un intento fallido y bloquea la IP al superar el límite.
 */
const registerFail = (ip: string): void => {
    const record = attempts.get(ip) ?? { fails: 0, blockedUntil: 0 };

    //  -----  si ya estaba bloqueada, mantener el bloqueo en curso  -----
    if (record.blockedUntil >= Date.now()) {
        return;
    }

    record.fails += 1;

    //  -----  al superar el límite, bloquear durante un cuarto de hora  -----
    if (record.fails >= MAX_LOGIN_FAILS) {
        record.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
        record.fails = 0;
    }

    attempts.set(ip, record);
};

/**
 * ------------------------------
 * -----  `registerSuccess()`  -----
 * ------------------------------
 * - Limpia el historial de intentos fallidos de una IP.
 */
const registerSuccess = (ip: string): void => {
    attempts.delete(ip);
};

export class AuthController {
    /**
     * ------------------------
     * -----  `login()`  -----
     * ------------------------
     * - Valida credenciales, crea la sesión y fija la cookie de acceso.
     */
    async login(req: Request, res: Response): Promise<void> {
        const ip = req.ip ?? 'unknown';

        //  -----  si la IP está bloqueada, rechazar sin comprobar credenciales  -----
        if (isBlocked(ip)) {
            res.status(429).json({
                error: 'Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos',
            });
            return;
        }

        const body = req.body as Partial<LoginDto>;
        const username = typeof body?.username === 'string' ? body.username.trim() : '';
        const password = typeof body?.password === 'string' ? body.password : '';

        //  -----  credenciales vacías no llegan ni a compararse  -----
        if (!username || !password) {
            res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
            return;
        }

        let token: string;
        try {
            token = await loginService(username, password);
        }
        catch (error) {
            registerFail(ip);
            res.status(401).json({ error: (error as Error).message });
            return;
        }

        registerSuccess(ip);
        res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
        res.json({ ok: true });
    }

    /**
     * -------------------------
     * -----  `logout()`  -----
     * -------------------------
     * - Cierra la sesión actual y elimina la cookie.
     */
    logout(req: Request, res: Response): void {
        const header = req.headers.cookie ?? '';
        const token = header
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
            ?.slice(SESSION_COOKIE_NAME.length + 1);

        //  -----  si hay token, cerrar su sesión en el servidor  -----
        if (token) {
            try {
                logoutService(decodeURIComponent(token));
            }
            catch {
                //  -----  token ilegible: basta con limpiar la cookie  -----
            }
        }

        res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
        res.status(204).send();
    }

    /**
     * ---------------------------
     * -----  `session()`  -----
     * ---------------------------
     * - Indica si hay sesión activa; responde siempre 200 para que el
     *   guard del frontend no genere errores 401 en consola.
     */
    async session(req: Request, res: Response): Promise<void> {
        const header = req.headers.cookie ?? '';
        const token = header
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
            ?.slice(SESSION_COOKIE_NAME.length + 1);

        //  -----  sin cookie, no hay sesión  -----
        if (!token) {
            res.json({ authenticated: false });
            return;
        }

        let user: AuthUser | undefined;
        try {
            user = await authenticate(decodeURIComponent(token));
        }
        catch {
            //  -----  token ilegible: se trata como sesión no válida  -----
        }

        //  -----  sesión inexistente o expirada  -----
        if (!user) {
            res.json({ authenticated: false });
            return;
        }

        res.json({ authenticated: true, username: user.username });
    }

    /**
     * ---------------------
     * -----  `me()`  -----
     * ---------------------
     * - Devuelve los datos del usuario autenticado (requiere sesión válida).
     */
    me(req: Request, res: Response): void {
        if (!req.authUser) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        res.json(publicUser(req.authUser));
    }
}

export const authController = new AuthController();
