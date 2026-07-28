/*
 *  ----------------------------------------------------  *
 *  -----  task.ts  --  /client/src/types/task.ts  -----  *
 *  ----------------------------------------------------  *
 */

/** Registro de tiempo: un tramo horario dedicado a una tarea o subtarea. */
export interface TimeEntry {
    id: string;
    /** Día del registro en formato "YYYY-MM-DD" */
    date: string;
    /** Hora de inicio "HH:MM" */
    start: string;
    /** Hora final "HH:MM" */
    end: string;
    /** Duración en minutos (si `end` <= `start` el tramo cruza medianoche) */
    minutes: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    /** `false` = subtarea dada de baja (se conserva con su histórico) */
    active: boolean;
    entries: TimeEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    color: string;
    completed: boolean;
    /** `false` = tarea dada de baja (se conserva con su histórico) */
    active: boolean;
    subtasks: Subtask[];
    /** Tiempo imputado a la tarea sin pasar por una subtarea */
    entries: TimeEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    color?: string;
    subtasks?: string[];
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    color?: string;
    completed?: boolean;
    active?: boolean;
}

export interface CreateSubtaskDto {
    title: string;
}

export interface UpdateSubtaskDto {
    title?: string;
    completed?: boolean;
    active?: boolean;
}

export interface CreateTimeEntryDto {
    taskId: string;
    subtaskId?: string | null;
    date: string;
    start: string;
    end: string;
    /** Actividad realizada en ese tiempo (obligatoria) */
    note: string;
}

export interface UpdateTimeEntryDto {
    date?: string;
    start?: string;
    end?: string;
    note?: string;
}

export interface TimeEntryView extends TimeEntry {
    taskId: string;
    taskTitle: string;
    taskColor: string;
    subtaskId?: string;
    subtaskTitle?: string;
}

export interface DayTotal {
    date: string;
    minutes: number;
}

export interface SubtaskReport {
    id: string;
    title: string;
    active: boolean;
    minutes: number;
    entries: number;
}

export interface TaskReport {
    id: string;
    title: string;
    color: string;
    active: boolean;
    /** Minutos imputados directamente a la tarea (sin subtarea) */
    directMinutes: number;
    minutes: number;
    entries: number;
    subtasks: SubtaskReport[];
}

export interface ReportSummary {
    from?: string;
    to?: string;
    totalMinutes: number;
    days: DayTotal[];
    tasks: TaskReport[];
}

export interface StatsSummary {
    date: string;
    todayMinutes: number;
    weekMinutes: number;
    monthMinutes: number;
    weekFrom: string;
    weekTo: string;
    monthFrom: string;
    monthTo: string;
    activeTasks: number;
    activeSubtasks: number;
}
