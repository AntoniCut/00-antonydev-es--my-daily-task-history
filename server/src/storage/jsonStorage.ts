import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Task } from '../types/task.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

/** Almacenamiento de tareas en un archivo JSON plano. */
export class JsonStorage {
  private async ensureFile(): Promise<void> {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    if (!existsSync(DATA_FILE)) {
      await writeFile(DATA_FILE, '[]', 'utf-8');
    }
  }

  async readAll(): Promise<Task[]> {
    await this.ensureFile();
    const raw = await readFile(DATA_FILE, 'utf-8');
    try {
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  }

  async writeAll(tasks: Task[]): Promise<void> {
    await this.ensureFile();
    await writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
  }
}

export const jsonStorage = new JsonStorage();
