/*
	*  -------------------------------------------------------------------------  *
	*  -----  tasks.service.ts  --  /server/src/services/tasks.service.ts  -----  *
	*  -------------------------------------------------------------------------  *
*/
import { randomUUID } from 'node:crypto';
import { jsonStorage } from '../storage/jsonStorage.js';
import { isHexColor, nextColor } from '../utils/colors.js';
import type {
  CreateSubtaskDto,
  CreateTaskDto,
  Subtask,
  Task,
  UpdateSubtaskDto,
  UpdateTaskDto,
} from '../types/task.js';

const MAX_TITLE_LENGTH = 120;

const requireTitle = (value: unknown, label = 'El título'): string => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) throw new Error(`${label} es obligatorio`);
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`${label} no puede superar ${MAX_TITLE_LENGTH} caracteres`);
  }
  return title;
};

const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }): number =>
  a.createdAt.localeCompare(b.createdAt);

export class TasksService {
  /** Tareas ordenadas por antigüedad; las dadas de baja quedan al final. */
  async getAll(includeInactive = true): Promise<Task[]> {
    const tasks = await jsonStorage.readAll();
    return tasks
      .filter((task) => includeInactive || task.active)
      .sort((a, b) => Number(b.active) - Number(a.active) || byCreatedAt(a, b));
  }

  async getById(id: string): Promise<Task | undefined> {
    const tasks = await jsonStorage.readAll();
    return tasks.find((task) => task.id === id);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const title = requireTitle(dto?.title);
    const tasks = await jsonStorage.readAll();
    const now = new Date().toISOString();

    const subtaskTitles = Array.isArray(dto.subtasks) ? dto.subtasks : [];
    const subtasks = subtaskTitles
      .filter((subtaskTitle) => optionalText(subtaskTitle))
      .map((subtaskTitle) =>
        this.buildSubtask(requireTitle(subtaskTitle, 'El título de la subtarea'), now),
      );

    const task: Task = {
      id: randomUUID(),
      title,
      description: optionalText(dto.description),
      color: isHexColor(dto.color) ? dto.color : nextColor(tasks.length),
      completed: false,
      active: true,
      subtasks,
      entries: [],
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(task);
    await jsonStorage.writeAll(tasks);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | undefined> {
    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === id);
    if (!task) return undefined;

    if (dto.title !== undefined) task.title = requireTitle(dto.title);
    if (dto.description !== undefined) {
      task.description = optionalText(dto.description);
    }
    if (dto.color !== undefined) {
      if (!isHexColor(dto.color)) {
        throw new Error('El color debe ser un hexadecimal tipo #5b8def');
      }
      task.color = dto.color;
    }
    if (dto.completed !== undefined) task.completed = Boolean(dto.completed);
    if (dto.active !== undefined) task.active = Boolean(dto.active);
    task.updatedAt = new Date().toISOString();

    await jsonStorage.writeAll(tasks);
    return task;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await jsonStorage.readAll();
    const remaining = tasks.filter((task) => task.id !== id);
    if (remaining.length === tasks.length) return false;
    await jsonStorage.writeAll(remaining);
    return true;
  }

  async addSubtask(
    taskId: string,
    dto: CreateSubtaskDto,
  ): Promise<Subtask | undefined> {
    const title = requireTitle(dto?.title, 'El título de la subtarea');
    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return undefined;

    const now = new Date().toISOString();
    const subtask = this.buildSubtask(title, now);
    task.subtasks.push(subtask);
    task.updatedAt = now;

    await jsonStorage.writeAll(tasks);
    return subtask;
  }

  async updateSubtask(
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ): Promise<Subtask | undefined> {
    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === taskId);
    const subtask = task?.subtasks.find((item) => item.id === subtaskId);
    if (!task || !subtask) return undefined;

    if (dto.title !== undefined) {
      subtask.title = requireTitle(dto.title, 'El título de la subtarea');
    }
    if (dto.completed !== undefined) subtask.completed = Boolean(dto.completed);
    if (dto.active !== undefined) subtask.active = Boolean(dto.active);

    const now = new Date().toISOString();
    subtask.updatedAt = now;
    task.updatedAt = now;

    await jsonStorage.writeAll(tasks);
    return subtask;
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<boolean> {
    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return false;

    const remaining = task.subtasks.filter((item) => item.id !== subtaskId);
    if (remaining.length === task.subtasks.length) return false;

    task.subtasks = remaining;
    task.updatedAt = new Date().toISOString();
    await jsonStorage.writeAll(tasks);
    return true;
  }

  private buildSubtask(title: string, now: string): Subtask {
    return {
      id: randomUUID(),
      title,
      completed: false,
      active: true,
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const tasksService = new TasksService();
