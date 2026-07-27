/*
 *  ------------------------------------------------  *
 *  -----  api.ts  --  /client/src/lib/api.ts  -----  *
 *  ------------------------------------------------  *
 */
import type {
    CreateSubtaskDto,
    CreateTaskDto,
    CreateTimeEntryDto,
    DayTotal,
    ReportSummary,
    StatsSummary,
    Subtask,
    Task,
    TimeEntryView,
    UpdateSubtaskDto,
    UpdateTaskDto,
    UpdateTimeEntryDto,
} from '../types/task';

const API_URL = import.meta.env.PUBLIC_API_URL ?? '/api';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(
            body?.error ?? `Error ${response.status} al llamar a la API`,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }
    return (await response.json()) as T;
};

const query = (params: Record<string, string | undefined>): string => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
    }
    const queryString = search.toString();
    return queryString ? `?${queryString}` : '';
};

export const api = {
    /* ---------------------------  Tareas  --------------------------- */

    getTasks: (options: { includeInactive?: boolean } = {}): Promise<Task[]> =>
        request<Task[]>(
            `/tasks${options.includeInactive === false ? '?includeInactive=false' : ''}`,
        ),

    getTask: (id: string): Promise<Task> => request<Task>(`/tasks/${id}`),

    createTask: (dto: CreateTaskDto): Promise<Task> =>
        request<Task>('/tasks', { method: 'POST', body: JSON.stringify(dto) }),

    updateTask: (id: string, dto: UpdateTaskDto): Promise<Task> =>
        request<Task>(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    deleteTask: (id: string): Promise<void> =>
        request<void>(`/tasks/${id}`, { method: 'DELETE' }),

    /* --------------------------  Subtareas  ------------------------- */

    createSubtask: (taskId: string, dto: CreateSubtaskDto): Promise<Subtask> =>
        request<Subtask>(`/tasks/${taskId}/subtasks`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    updateSubtask: (
        taskId: string,
        subtaskId: string,
        dto: UpdateSubtaskDto,
    ): Promise<Subtask> =>
        request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    deleteSubtask: (taskId: string, subtaskId: string): Promise<void> =>
        request<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'DELETE',
        }),

    /* ---------------------  Registros de tiempo  -------------------- */

    getEntries: (
        filter: {
            date?: string;
            from?: string;
            to?: string;
            taskId?: string;
            subtaskId?: string;
        } = {},
    ): Promise<TimeEntryView[]> =>
        request<TimeEntryView[]>(`/entries${query(filter)}`),

    createEntry: (dto: CreateTimeEntryDto): Promise<TimeEntryView> =>
        request<TimeEntryView>('/entries', {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    updateEntry: (
        id: string,
        dto: UpdateTimeEntryDto,
    ): Promise<TimeEntryView> =>
        request<TimeEntryView>(`/entries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    deleteEntry: (id: string): Promise<void> =>
        request<void>(`/entries/${id}`, { method: 'DELETE' }),

    /* ---------------------------  Informes  ------------------------- */

    getSummary: (
        range: { from?: string; to?: string; month?: string } = {},
    ): Promise<ReportSummary> =>
        request<ReportSummary>(`/reports/summary${query(range)}`),

    getDayTotals: (
        range: { from?: string; to?: string; month?: string } = {},
    ): Promise<DayTotal[]> =>
        request<DayTotal[]>(`/reports/days${query(range)}`),

    getStats: (date?: string): Promise<StatsSummary> =>
        request<StatsSummary>(`/reports/stats${query({ date })}`),
};
