/*
    *  ----------------------------------------------------------------------  *
    *  -----  usersStorage.ts  --  /server/src/storage/usersStorage.ts  -----  *
    *  ----------------------------------------------------------------------  *
*/
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AuthUser } from '../types/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Busca `server/data` subiendo desde este archivo, igual que jsonStorage.
 */
const resolveDataDir = (): string => {
    let dir = __dirname;
    for (let i = 0; i < 8; i++) {
        const candidate = path.join(dir, 'data');
        if (existsSync(candidate)) {
            return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return path.resolve(__dirname, '../../data');
};

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'users.json');
const SCHEMA_VERSION = 1;

interface UsersFile {
    version: number;
    users: AuthUser[];
}

/**
 * ---------------------------
 * -----  `emptyFile()`  -----
 * ---------------------------
 * - Crea la estructura vacia del archivo de usuarios.
 */
const emptyFile = (): UsersFile => ({ version: SCHEMA_VERSION, users: [] });

export class UsersStorage {
    /**
     * ---------------------------
     * -----  `ensureDir()`  -----
     * ---------------------------
     * - Garantiza que exista el directorio de datos antes de usarlo.
     */
    private async ensureDir(): Promise<void> {
        if (!existsSync(DATA_DIR)) {
            await mkdir(DATA_DIR, { recursive: true });
        }
    }

    /**
     * -----------------------
     * -----  `load()`  -----
     * -----------------------
     * - Carga el archivo de usuarios; si falta, arranca con la lista vacia.
     */
    private async load(): Promise<UsersFile> {
        await this.ensureDir();
        if (!existsSync(DATA_FILE)) {
            return emptyFile();
        }

        const raw = await readFile(DATA_FILE, 'utf-8');
        let parsed: unknown;

        try {
            parsed = JSON.parse(raw);
        }
        catch {
            //  -----  si el archivo esta corrupto, conservar copia antes de vaciarlo  -----
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const corruptFile = path.join(DATA_DIR, `users.corrupto-${stamp}.json`);
            console.warn(`users.json está corrupto; se conserva una copia en ${corruptFile}`);
            await rename(DATA_FILE, corruptFile);
            return emptyFile();
        }

        const data = parsed as Partial<UsersFile>;
        return {
            version: data.version ?? SCHEMA_VERSION,
            users: Array.isArray(data.users) ? data.users : [],
        };
    }

    /**
     * -----------------------
     * -----  `save()`  -----
     * -----------------------
     * - Persiste el archivo de usuarios con formato JSON legible y escritura atomica.
     */
    private async save(data: UsersFile): Promise<void> {
        await this.ensureDir();
        const tmpFile = `${DATA_FILE}.tmp`;
        await writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
        await rename(tmpFile, DATA_FILE);
    }

    /**
     * --------------------------------
     * -----  `findByUsername()`  -----
     * --------------------------------
     * - Devuelve el usuario con ese nombre (normalizado) o undefined.
     */
    async findByUsername(username: string): Promise<AuthUser | undefined> {
        const data = await this.load();
        return data.users.find(
            (user) => user.username.toLowerCase() === username.trim().toLowerCase(),
        );
    }

    /**
     * -------------------------
     * -----  `upsert()`  -----
     * -------------------------
     * - Crea un usuario nuevo o actualiza la contraseña del existente.
     */
    async upsert(user: AuthUser): Promise<void> {
        const data = await this.load();
        const index = data.users.findIndex((existing) => existing.id === user.id);
        if (index >= 0) {
            data.users[index] = user;
        }
        else {
            data.users.push(user);
        }
        await this.save(data);
    }
}

export const usersStorage = new UsersStorage();
