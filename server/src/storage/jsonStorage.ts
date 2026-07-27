/*
	*  --------------------------------------------------------------------  *
	*  -----  jsonStorage.ts  --  /server/src/storage/jsonStorage.ts  -----  *
	*  --------------------------------------------------------------------  *
*/
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Task } from '../types/task.js';
import { TASK_COLORS } from '../utils/colors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tasks.v1.backup.json');

/** Versión del formato del archivo de datos. */
const SCHEMA_VERSION = 2;

interface DataFile {
  version: number;
  tasks: Task[];
}

/** Formato v1: lista plana de tareas atadas a un único día, sin subtareas. */
interface LegacyTask {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const emptyFile = (): DataFile => ({ version: SCHEMA_VERSION, tasks: [] });

/**
 * Convierte el formato v1 al actual: cada título distinto pasa a ser una tarea
 * del gestor. Las fechas de v1 no se pueden convertir en registros de tiempo
 * (no guardaban horas), así que el archivo original se conserva como copia.
 */
const migrateFromV1 = (legacy: LegacyTask[]): Task[] => {
  const byTitle = new Map<string, Task>();

  for (const old of legacy) {
    const title = old.title?.trim();
    if (!title) continue;

    const key = title.toLowerCase();
    const existing = byTitle.get(key);
    const createdAt = old.createdAt ?? new Date().toISOString();

    if (existing) {
      if (!existing.description && old.description?.trim()) {
        existing.description = old.description.trim();
      }
      if (createdAt < existing.createdAt) existing.createdAt = createdAt;
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

/** Almacenamiento de tareas en un archivo JSON plano. */
export class JsonStorage {
  private async ensureDir(): Promise<void> {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
  }

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
    } catch {
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

  private async save(data: DataFile): Promise<void> {
    await this.ensureDir();
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  async readAll(): Promise<Task[]> {
    const data = await this.load();
    return data.tasks;
  }

  async writeAll(tasks: Task[]): Promise<void> {
    await this.save({ version: SCHEMA_VERSION, tasks });
  }
}

export const jsonStorage = new JsonStorage();
