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

const resolveColor = (value: unknown, fallback: string): string =>
  isHexColor(value) ? value : fallback;

const normalizeSubtask = (subtask: Subtask, task: Task): Subtask => ({
  ...subtask,
  color: resolveColor(subtask.color, task.color),
});

const normalizeTask = (task: Task): Task => ({
  ...task,
  subtasks: task.subtasks.map((subtask) => normalizeSubtask(subtask, task)),
});

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }): number =>
  a.createdAt.localeCompare(b.createdAt);

/** Normaliza un título para compararlo sin distinguir mayúsculas ni espacios repetidos. */
const normalizeTitle = (title: string): string =>
  title.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Impide títulos duplicados: lanza un error si ya existe otra tarea activa
 * con el mismo título normalizado. `excludeId` ignora la propia tarea al
 * renombrarla. Las tareas dadas de baja no bloquean el título.
 */
const assertUniqueActiveTitle = (
  tasks: Task[],
  title: string,
  excludeId?: string,
): void => {
  const normalized = normalizeTitle(title);
  const duplicated = tasks.some(
    (task) =>
      task.id !== excludeId &&
      task.active &&
      normalizeTitle(task.title) === normalized,
  );
  if (duplicated) {
    throw new Error(`Ya existe una tarea activa con el título "${title}"`);
  }
};

export class TasksService {
  /** Tareas ordenadas por antigüedad; las dadas de baja quedan al final. */
  async getAll(includeInactive = true): Promise<Task[]> {
    const tasks = await jsonStorage.readAll();
    return tasks
      .map(normalizeTask)
      .filter((task) => includeInactive || task.active)
      .sort((a, b) => Number(b.active) - Number(a.active) || byCreatedAt(a, b));
  }

  async getById(id: string): Promise<Task | undefined> {
    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === id);
    return task ? normalizeTask(task) : undefined;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const title = requireTitle(dto?.title);
    const tasks = await jsonStorage.readAll();
    assertUniqueActiveTitle(tasks, title);
    const now = new Date().toISOString();

    const taskColor = isHexColor(dto.color) ? dto.color : nextColor(tasks.length);

    const subtaskDrafts = Array.isArray(dto.subtasks) ? dto.subtasks : [];
    const subtasks = subtaskDrafts
      .map((draft) => ({
        title: requireTitle(draft?.title, 'El título de la subtarea'),
        color: draft?.color,
      }))
      .map((draft, index) =>
        this.buildSubtask(draft.title, now, resolveColor(draft.color, taskColor)),
      );

    const task: Task = {
      id: randomUUID(),
      title,
      description: optionalText(dto.description),
      color: taskColor,
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

    if (dto.title !== undefined) {
      const title = requireTitle(dto.title);
      assertUniqueActiveTitle(tasks, title, id);
      task.title = title;
    }
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
    const subtask = this.buildSubtask(
      title,
      now,
      resolveColor(dto.color, task.color),
    );
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
    if (dto.color !== undefined) {
      if (!isHexColor(dto.color)) {
        throw new Error('El color debe ser un hexadecimal tipo #5b8def');
      }
      subtask.color = dto.color;
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

  private buildSubtask(title: string, now: string, color: string): Subtask {
    return {
      id: randomUUID(),
      title,
      color,
      completed: false,
      active: true,
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const tasksService = new TasksService();
