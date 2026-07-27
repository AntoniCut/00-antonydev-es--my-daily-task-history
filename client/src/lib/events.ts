/*
	*  ------------------------------------------------------  *
	*  -----  events.ts  --  /client/src/lib/events.ts  -----  *
	*  ------------------------------------------------------  *
*/
import type { Task } from '../types/task';

/** Eventos personalizados para la comunicación entre componentes. */
export const APP_EVENTS = {
    dateSelected: 'app:date-selected',
    tasksChanged: 'app:tasks-changed',
    editTask: 'app:edit-task',
} as const;

export function emitDateSelected(date: string): void {
    document.dispatchEvent(
        new CustomEvent<string>(APP_EVENTS.dateSelected, { detail: date }),
    );
}

export function emitTasksChanged(): void {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.tasksChanged));
}

export function emitEditTask(task: Task): void {
    document.dispatchEvent(
        new CustomEvent<Task>(APP_EVENTS.editTask, { detail: task }),
    );
}

export function onDateSelected(handler: (date: string) => void): void {
    document.addEventListener(APP_EVENTS.dateSelected, (event) => {
        handler((event as CustomEvent<string>).detail);
    });
}

export function onTasksChanged(handler: () => void): void {
    document.addEventListener(APP_EVENTS.tasksChanged, handler);
}

export function onEditTask(handler: (task: Task) => void): void {
    document.addEventListener(APP_EVENTS.editTask, (event) => {
        handler((event as CustomEvent<Task>).detail);
    });
}
