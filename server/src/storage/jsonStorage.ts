/*
    *  --------------------------------------------------------------------  *
    *  -----  jsonStorage.ts  --  /server/src/storage/jsonStorage.ts  -----  *
    *  --------------------------------------------------------------------  *
*/
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Task } from '../types/types.js';
import { TASK_COLORS } from '../utils/colors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Busca `server/data` subiendo desde este archivo. Prefiere la carpeta que
 * ya tenga `tasks.json` y evita rutas bajo `dist/`.
 */
const resolveDataDir = (): string => {
    const found: string[] = [];
    let dir = __dirname;
    for (let i = 0; i < 8; i++) {
        const candidate = path.join(dir, 'data');
        if (existsSync(candidate)) {
            found.push(candidate);
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }

    const notUnderDist = (candidate: string): boolean => !candidate.includes(`${path.sep}dist${path.sep}`);
    const withTasks = found.filter((candidate) => existsSync(path.join(candidate, 'tasks.json')));

    return (
        withTasks.find(notUnderDist) ??
        withTasks[0] ??
        found.find(notUnderDist) ??
        found[0] ??
        path.resolve(__dirname, '../../data')
    );
};

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tasks.v1.backup.json');
const SCHEMA_VERSION = 2;

interface DataFile {
    version: number;
    tasks: Task[];
}

interface LegacyTask {
    id?: string;
    title?: string;
    description?: string;
    date?: string;
    completed?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * ---------------------------
 * -----  `emptyFile()`  -----
 * ---------------------------
 * - Crea la estructura vacia del archivo de datos.
 */
const emptyFile = (): DataFile => ({ version: SCHEMA_VERSION, tasks: [] });

/**
 * --------------------------------
 * -----  `migrateFromV1()`  -----
 * --------------------------------
 * - Convierte el formato legado de tareas al formato actual del servidor.
 */
const migrateFromV1 = (legacy: LegacyTask[]): Task[] => {
    const byTitle = new Map<string, Task>();

    for (const old of legacy) {
        const title = old.title?.trim();
        if (!title) {
            continue;
        }

        const key = title.toLowerCase();
        const existing = byTitle.get(key);
        const createdAt = old.createdAt ?? new Date().toISOString();

        if (existing) {
            if (!existing.description && old.description?.trim()) {
                existing.description = old.description.trim();
            }

            if (createdAt < existing.createdAt) {
                existing.createdAt = createdAt;
            }

            continue;
        }

        byTitle.set(key, {
            id: old.id ?? randomUUID(),
            title,
            description: old.description?.trim() || undefined,
            color: TASK_COLORS[byTitle.size % TASK_COLORS.length],
            completed: old.completed ?? false,
            active: true,
            subtasks: [],
            entries: [],
            createdAt,
            updatedAt: old.updatedAt ?? createdAt,
        });
    }

    return [...byTitle.values()];
};

export class JsonStorage {
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
     * - Carga el archivo de datos y migra formatos antiguos cuando hace falta.
     */
    private async load(): Promise<DataFile> {
        await this.ensureDir();
        if (!existsSync(DATA_FILE)) {
            await this.save(emptyFile());
            return emptyFile();
        }

        const raw = await readFile(DATA_FILE, 'utf-8');
        let parsed: unknown;

        try {
            parsed = JSON.parse(raw);
        }
        catch {
            return emptyFile();
        }

        if (Array.isArray(parsed)) {
            const tasks = migrateFromV1(parsed as LegacyTask[]);
            if (!existsSync(BACKUP_FILE)) {
                await rename(DATA_FILE, BACKUP_FILE);
            }

            const migrated: DataFile = { version: SCHEMA_VERSION, tasks };
            await this.save(migrated);
            return migrated;
        }

        const data = parsed as Partial<DataFile>;
        return {
            version: data.version ?? SCHEMA_VERSION,
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
        };
    }

    /**
     * -----------------------
     * -----  `save()`  -----
     * -----------------------
     * - Persiste el archivo de datos con formato JSON legible.
     */
    private async save(data: DataFile): Promise<void> {
        await this.ensureDir();
        await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * --------------------------
     * -----  `readAll()`  -----
     * --------------------------
     * - Devuelve la lista completa de tareas almacenadas.
     */
    async readAll(): Promise<Task[]> {
        const data = await this.load();
        return data.tasks;
    }

    /**
     * ---------------------------
     * -----  `writeAll()`  -----
     * ---------------------------
     * - Guarda la lista completa de tareas con la version actual del esquema.
     */
    async writeAll(tasks: Task[]): Promise<void> {
        await this.save({ version: SCHEMA_VERSION, tasks });
    }
}

export const jsonStorage = new JsonStorage();
