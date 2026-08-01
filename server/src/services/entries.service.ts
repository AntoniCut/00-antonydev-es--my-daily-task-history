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
} from '../../types/types.js';

export interface EntriesFilter {
    from?: string;
    to?: string;
    date?: string;
    taskId?: string;
    subtaskId?: string;
}

/**
 * ----------------------------
 * -----  `assertDate()`  -----
 * ----------------------------
 * - Valida que una fecha use el formato esperado.
 */
const assertDate = (value: unknown): string => {
    if (!isDateKey(value)) {
        throw new Error('La fecha debe tener formato YYYY-MM-DD');
    }

    return value;
};

/**
 * ----------------------------
 * -----  `assertTime()`  -----
 * ----------------------------
 * - Valida que una hora use el formato esperado.
 */
const assertTime = (value: unknown, label: string): string => {
    if (!isTimeKey(value)) {
        throw new Error(`${label} debe tener formato HH:MM`);
    }

    return value;
};

/**
 * -----------------------------
 * -----  `assertRange()`  -----
 * -----------------------------
 * - Calcula la duracion del tramo horario y evita rangos vacios.
 */
const assertRange = (start: string, end: string): number => {
    if (start === end) {
        throw new Error('La hora final no puede ser igual a la hora de inicio');
    }

    return durationInMinutes(start, end);
};

/**
 * --------------------------------
 * -----  `assertActivity()`  -----
 * --------------------------------
 * - Valida que el registro incluya una actividad descriptiva.
 */
const assertActivity = (value: unknown): string => {
    const activity = typeof value === 'string' ? value.trim() : '';
    if (!activity) {
        throw new Error('La actividad es obligatoria: describe qué hiciste en ese tiempo');
    }

    return activity;
};

export class EntriesService {
    /**
     * ----------------------
     * -----  `list()`  -----
     * ----------------------
     * - Lista los registros de tiempo aplicando los filtros recibidos.
     */
    async list(filter: EntriesFilter = {}): Promise<TimeEntryView[]> {
        const tasks = await jsonStorage.readAll();
        const from = filter.date ?? filter.from;
        const to = filter.date ?? filter.to;

        const entries = flattenEntries(tasks).filter((entry) => {
            if (!isWithinRange(entry.date, from, to)) {
                return false;
            }

            if (filter.taskId && entry.taskId !== filter.taskId) {
                return false;
            }

            if (filter.subtaskId && entry.subtaskId !== filter.subtaskId) {
                return false;
            }

            return true;
        });

        return sortEntries(entries);
    }

    /**
     * ------------------------
     * -----  `create()`  -----
     * ------------------------
     * - Crea un registro de tiempo para una tarea o subtarea existente.
     */
    async create(dto: CreateTimeEntryDto): Promise<TimeEntryView | undefined> {
        const date = assertDate(dto?.date);
        const start = assertTime(dto?.start, 'La hora de inicio');
        const end = assertTime(dto?.end, 'La hora final');
        const minutes = assertRange(start, end);
        const activity = assertActivity(dto?.note);

        const tasks = await jsonStorage.readAll();
        const task = tasks.find((item) => item.id === dto.taskId);
        if (!task) {
            return undefined;
        }

        const subtask = dto.subtaskId
            ? task.subtasks.find((item) => item.id === dto.subtaskId)
            : undefined;
        if (dto.subtaskId && !subtask) {
            return undefined;
        }

        const now = new Date().toISOString();
        const entry: TimeEntry = {
            id: randomUUID(),
            date,
            start,
            end,
            minutes,
            note: activity,
            createdAt: now,
            updatedAt: now,
        };

        (subtask ?? task).entries.push(entry);
        task.updatedAt = now;
        await jsonStorage.writeAll(tasks);
        return toEntryView(entry, task, subtask);
    }

    /**
     * ------------------------
     * -----  `update()`  -----
     * ------------------------
     * - Actualiza un registro existente y recalcula su duracion.
     */
    async update(
        id: string,
        dto: UpdateTimeEntryDto,
    ): Promise<TimeEntryView | undefined> {
        const tasks = await jsonStorage.readAll();
        const location = findEntry(tasks, id);
        if (!location) {
            return undefined;
        }

        const { task, subtask, entry } = location;
        if (dto.date !== undefined) {
            entry.date = assertDate(dto.date);
        }

        if (dto.start !== undefined) {
            entry.start = assertTime(dto.start, 'La hora de inicio');
        }

        if (dto.end !== undefined) {
            entry.end = assertTime(dto.end, 'La hora final');
        }

        if (dto.note !== undefined) {
            entry.note = assertActivity(dto.note);
        }

        entry.minutes = assertRange(entry.start, entry.end);

        const now = new Date().toISOString();
        entry.updatedAt = now;
        task.updatedAt = now;
        await jsonStorage.writeAll(tasks);
        return toEntryView(entry, task, subtask);
    }

    /**
     * ------------------------
     * -----  `delete()`  -----
     * ------------------------
     * - Elimina un registro de tiempo por su identificador.
     */
    async delete(id: string): Promise<boolean> {
        const tasks = await jsonStorage.readAll();
        const location = findEntry(tasks, id);
        if (!location) {
            return false;
        }

        const { task, subtask, entry } = location;
        const owner = subtask ?? task;
        owner.entries = owner.entries.filter((item) => item.id !== entry.id);
        task.updatedAt = new Date().toISOString();
        await jsonStorage.writeAll(tasks);
        return true;
    }
}

export const entriesService = new EntriesService();
