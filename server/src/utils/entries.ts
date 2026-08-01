/*
	*  ----------------------------------------------------------  *
	*  -----  entries.ts  --  /server/src/utils/entries.ts  -----  *
	*  ----------------------------------------------------------  *
*/
import type { Subtask, Task, TimeEntry, TimeEntryView } from '../types/task.js';

export interface EntryLocation {
  task: Task;
  subtask?: Subtask;
  entry: TimeEntry;
}

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

/** Recorre el árbol de tareas y devuelve todos los registros de tiempo. */
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

/** Localiza un registro (y sus padres) por id dentro del árbol de tareas. */
export const findEntry = (
  tasks: Task[],
  entryId: string,
): EntryLocation | undefined => {
  for (const task of tasks) {
    const own = task.entries.find((entry) => entry.id === entryId);
    if (own) return { task, entry: own };

    for (const subtask of task.subtasks) {
      const entry = subtask.entries.find((item) => item.id === entryId);
      if (entry) return { task, subtask, entry };
    }
  }
  return undefined;
};

export const sortEntries = (entries: TimeEntryView[]): TimeEntryView[] =>
  entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
  );
