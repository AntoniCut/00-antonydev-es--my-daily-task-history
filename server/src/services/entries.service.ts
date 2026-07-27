/*
	*  -----------------------------------------------------------------------------  *
	*  -----  entries.service.ts  --  /server/src/services/entries.service.ts  -----  *
	*  -----------------------------------------------------------------------------  *
*/
import { randomUUID } from 'node:crypto';
import { jsonStorage } from '../storage/jsonStorage.js';
import {
  findEntry,
  flattenEntries,
  sortEntries,
  toEntryView,
} from '../utils/entries.js';
import { durationInMinutes, isDateKey, isTimeKey, isWithinRange } from '../utils/time.js';
import type {
  CreateTimeEntryDto,
  TimeEntry,
  TimeEntryView,
  UpdateTimeEntryDto,
} from '../types/task.js';

export interface EntriesFilter {
  from?: string;
  to?: string;
  date?: string;
  taskId?: string;
  subtaskId?: string;
}

const assertDate = (value: unknown): string => {
  if (!isDateKey(value)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD');
  }
  return value;
};

const assertTime = (value: unknown, label: string): string => {
  if (!isTimeKey(value)) {
    throw new Error(`${label} debe tener formato HH:MM`);
  }
  return value;
};

const assertRange = (start: string, end: string): number => {
  if (start === end) {
    throw new Error('La hora final no puede ser igual a la hora de inicio');
  }
  return durationInMinutes(start, end);
};

export class EntriesService {
  async list(filter: EntriesFilter = {}): Promise<TimeEntryView[]> {
    const tasks = await jsonStorage.readAll();
    const from = filter.date ?? filter.from;
    const to = filter.date ?? filter.to;

    const entries = flattenEntries(tasks).filter((entry) => {
      if (!isWithinRange(entry.date, from, to)) return false;
      if (filter.taskId && entry.taskId !== filter.taskId) return false;
      if (filter.subtaskId && entry.subtaskId !== filter.subtaskId) return false;
      return true;
    });

    return sortEntries(entries);
  }

  /** Crea un registro. Devuelve `undefined` si la tarea o subtarea no existe. */
  async create(dto: CreateTimeEntryDto): Promise<TimeEntryView | undefined> {
    const date = assertDate(dto?.date);
    const start = assertTime(dto?.start, 'La hora de inicio');
    const end = assertTime(dto?.end, 'La hora final');
    const minutes = assertRange(start, end);

    const tasks = await jsonStorage.readAll();
    const task = tasks.find((item) => item.id === dto.taskId);
    if (!task) return undefined;

    const subtask = dto.subtaskId
      ? task.subtasks.find((item) => item.id === dto.subtaskId)
      : undefined;
    if (dto.subtaskId && !subtask) return undefined;

    const now = new Date().toISOString();
    const entry: TimeEntry = {
      id: randomUUID(),
      date,
      start,
      end,
      minutes,
      note: typeof dto.note === 'string' && dto.note.trim() ? dto.note.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    (subtask ?? task).entries.push(entry);
    task.updatedAt = now;
    await jsonStorage.writeAll(tasks);

    return toEntryView(entry, task, subtask);
  }

  async update(
    id: string,
    dto: UpdateTimeEntryDto,
  ): Promise<TimeEntryView | undefined> {
    const tasks = await jsonStorage.readAll();
    const location = findEntry(tasks, id);
    if (!location) return undefined;

    const { task, subtask, entry } = location;
    if (dto.date !== undefined) entry.date = assertDate(dto.date);
    if (dto.start !== undefined) {
      entry.start = assertTime(dto.start, 'La hora de inicio');
    }
    if (dto.end !== undefined) entry.end = assertTime(dto.end, 'La hora final');
    if (dto.note !== undefined) {
      entry.note = dto.note.trim() || undefined;
    }
    entry.minutes = assertRange(entry.start, entry.end);

    const now = new Date().toISOString();
    entry.updatedAt = now;
    task.updatedAt = now;

    await jsonStorage.writeAll(tasks);
    return toEntryView(entry, task, subtask);
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await jsonStorage.readAll();
    const location = findEntry(tasks, id);
    if (!location) return false;

    const { task, subtask, entry } = location;
    const owner = subtask ?? task;
    owner.entries = owner.entries.filter((item) => item.id !== entry.id);
    task.updatedAt = new Date().toISOString();

    await jsonStorage.writeAll(tasks);
    return true;
  }
}

export const entriesService = new EntriesService();
