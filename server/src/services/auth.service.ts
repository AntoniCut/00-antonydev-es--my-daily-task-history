/*
    *  -----------------------------------------------------------------------  *
    *  -----  auth.service.ts  --  /server/src/services/auth.service.ts  -----  *
    *  -----------------------------------------------------------------------  *
*/
import { promisify } from 'node:util';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { usersStorage } from '../storage/usersStorage.js';
import type { AuthUser } from '../types/types.js';

const scryptAsync = promisify(scrypt);

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;

interface Session {
    userId: string;
    /** Instantánea del usuario al iniciar sesión; si cambia, la sesión caduca. */
    snapshot: AuthUser;
    expiresAt: number;
}

/** Sesiones activas en memoria: token -> sesión. Al reiniciar el proceso se cierran. */
const sessions = new Map<string, Session>();

/**
 * -------------------------------------
 * -----  `hashPassword()`  -----
 * -------------------------------------
 * - Hashea una contraseña con scrypt y una sal aleatoria.
 */
export const hashPassword = async (password: string): Promise<{ hash: string; salt: string }> => {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    return { hash: derived.toString('hex'), salt };
};

/**
 * ---------------------------------------
 * -----  `verifyPassword()`  -----
 * ---------------------------------------
 * - Comprueba una contraseña contra su hash almacenado.
 */
export const verifyPassword = async (
    password: string,
    salt: string,
    expectedHash: string,
): Promise<boolean> => {
    const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    const expected = Buffer.from(expectedHash, 'hex');

    //  -----  si las longitudes difieren, no comparar buffers (lanzaria)  -----
    if (derived.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(derived, expected);
};

/**
 * ---------------------------
 * -----  `createSession()`  -----
 * ---------------------------
 * - Crea una sesión nueva para el usuario y devuelve su token.
 */
const createSession = (user: AuthUser): string => {
    const token = randomBytes(32).toString('hex');
    sessions.set(token, {
        userId: user.id,
        snapshot: user,
        expiresAt: Date.now() + SESSION_TTL_MS,
    });
    return token;
};

/**
 * --------------------------------
 * -----  `authenticate()`  -----
 * --------------------------------
 * - Devuelve el usuario de la sesión si el token es válido y no ha expirado.
 */
export const authenticate = async (token: string): Promise<AuthUser | undefined> => {
    const session = sessions.get(token);

    //  -----  si la sesión no existe o expiró, eliminarla y responder undefined  -----
    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        return undefined;
    }

    //  -----  si el usuario cambió o fue eliminado, la sesión deja de ser válida  -----
    const current = await usersStorage.findByUsername(session.snapshot.username);
    if (!current || current.passwordHash !== session.snapshot.passwordHash) {
        sessions.delete(token);
        return undefined;
    }

    return current;
};

/**
 * ---------------------------
 * -----  `login()`  -----
 * ---------------------------
 * - Valida credenciales y devuelve el token de sesión.
 * - Lanza Error si el usuario o la contraseña son incorrectos.
 */
export const login = async (username: string, password: string): Promise<string> => {
    const user = await usersStorage.findByUsername(username);
    if (!user) {
        throw new Error('Usuario o contraseña incorrectos');
    }

    const valid = await verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
        throw new Error('Usuario o contraseña incorrectos');
    }

    return createSession(user);
};

/**
 * ---------------------------
 * -----  `logout()`  -----
 * ---------------------------
 * - Cierra la sesión asociada al token.
 */
export const logout = (token: string): void => {
    sessions.delete(token);
};
