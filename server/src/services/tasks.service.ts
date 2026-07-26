import { randomUUID } from 'node:crypto';
import { jsonStorage } from '../storage/jsonStorage.js';
import type { CreateTaskDto, Task, UpdateTaskDto } from '../types/task.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class TasksService {
  async getAll(date?: string): Promise<Task[]> {
    const tasks = await jsonStorage.readAll();
    const filtered = date ? tasks.filter((t) => t.date === date) : tasks;
    return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** Devuelve las fechas (YYYY-MM-DD) que tienen al menos una tarea en un mes dado. */
  async getDatesWithTasks(month?: string): Promise<string[]> {
    const tasks = await jsonStorage.readAll();
    const dates = new Set<string>();
    for (const task of tasks) {
      if (!month || task.date.startsWith(month)) {
        dates.add(task.date);
      }
    }
    return [...dates].sort();
  }

  async getById(id: string): Promise<Task | undefined> {
    const tasks = await jsonStorage.readAll();
    return tasks.find((t) => t.id === id);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    if (!dto.title?.trim()) {
      throw new Error('El título es obligatorio');
    }
    if (!dto.date || !DATE_REGEX.test(dto.date)) {
      throw new Error('La fecha debe tener formato YYYY-MM-DD');
    }

    const tasks = await jsonStorage.readAll();
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      date: dto.date,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    await jsonStorage.writeAll(tasks);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | undefined> {
    const tasks = await jsonStorage.readAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    if (dto.date !== undefined && !DATE_REGEX.test(dto.date)) {
      throw new Error('La fecha debe tener formato YYYY-MM-DD');
    }
    if (dto.title !== undefined && !dto.title.trim()) {
      throw new Error('El título no puede estar vacío');
    }

    const current = tasks[index];
    const updated: Task = {
      ...current,
      title: dto.title !== undefined ? dto.title.trim() : current.title,
      description:
        dto.description !== undefined
          ? dto.description.trim() || undefined
          : current.description,
      date: dto.date ?? current.date,
      completed: dto.completed ?? current.completed,
      updatedAt: new Date().toISOString(),
    };
    tasks[index] = updated;
    await jsonStorage.writeAll(tasks);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await jsonStorage.readAll();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    await jsonStorage.writeAll(filtered);
    return true;
  }
}

export const tasksService = new TasksService();
