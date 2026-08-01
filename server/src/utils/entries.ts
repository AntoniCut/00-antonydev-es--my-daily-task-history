/*
    *  ----------------------------------------------------------  *
    *  -----  entries.ts  --  /server/src/utils/entries.ts  -----  *
    *  ----------------------------------------------------------  *
*/
import type { Subtask, Task, TimeEntry, TimeEntryView } from '../../types/types.js';

export interface EntryLocation {
    task: Task;
    subtask?: Subtask;
    entry: TimeEntry;
}

/**
 * -----------------------------
 * -----  `toEntryView()`  -----
 * -----------------------------
 * - Combina un registro con los datos de su tarea y subtarea asociadas.
 */
export const toEntryView = (
    entry: TimeEntry,
    task: Task,
    subtask?: Subtask,
): TimeEntryView => ({
    ...entry,
    taskId: task.id,
    taskTitle: task.title,
    taskColor: subtask?.color ?? task.color,
    subtaskId: subtask?.id,
    subtaskTitle: subtask?.title,
});

/**
 * -------------------------------
 * -----  `flattenEntries()`  -----
 * -------------------------------
 * - Recorre el arbol de tareas y devuelve todos los registros de tiempo.
 */
export const flattenEntries = (tasks: Task[]): TimeEntryView[] => {
    const views: TimeEntryView[] = [];

    for (const task of tasks) {
        for (const entry of task.entries) {
            views.push(toEntryView(entry, task));
        }

        for (const subtask of task.subtasks) {
            for (const entry of subtask.entries) {
                views.push(toEntryView(entry, task, subtask));
            }
        }
    }

    return views;
};

/**
 * ----------------------------
 * -----  `findEntry()`  -----
 * ----------------------------
 * - Localiza un registro y sus padres dentro del arbol de tareas.
 */
export const findEntry = (
    tasks: Task[],
    entryId: string,
): EntryLocation | undefined => {
    for (const task of tasks) {
        const own = task.entries.find((entry) => entry.id === entryId);
        if (own) {
            return { task, entry: own };
        }

        for (const subtask of task.subtasks) {
            const entry = subtask.entries.find((item) => item.id === entryId);
            if (entry) {
                return { task, subtask, entry };
            }
        }
    }

    return undefined;
};

/**
 * -----------------------------
 * -----  `sortEntries()`  -----
 * -----------------------------
 * - Ordena los registros por fecha y hora de inicio.
 */
export const sortEntries = (entries: TimeEntryView[]): TimeEntryView[] =>
    entries.sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
    );
