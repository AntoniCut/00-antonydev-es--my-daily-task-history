/*
    *  ----------------------------------------------------------------  *
    *  -----  api.ts  --  /client/src/lib/api.ts  -----  *
    *  ----------------------------------------------------------------  *
*/
import type {
    CreateSubtaskDto,
    CreateTaskDto,
    CreateTimeEntryDto,
    ReportSummary,
    StatsSummary,
    Subtask,
    Task,
    TimeEntryView,
    UpdateSubtaskDto,
    UpdateTaskDto,
    UpdateTimeEntryDto,
} from '../../types/types';

const API_URL = import.meta.env.PUBLIC_API_URL ?? '/api';

/**
 * --------------------------------------------
 * -----  `request<T>(path, options)`  -----
 * --------------------------------------------
 * - Ejecuta una petición JSON contra la API y valida la respuesta.
 */
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

/**
 * --------------------------------
 * -----  `query(params)`  -----
 * --------------------------------
 * - Construye una query string a partir de parámetros opcionales.
 */
const query = (params: Record<string, string | undefined>): string => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value) {
            search.set(key, value);
        }
    }

    const queryString = search.toString();
    return queryString ? `?${queryString}` : '';
};

export const api = {
    /**
     * -----------------------------------------------------
     * -----  `getTasks()`  -----
     * -----------------------------------------------------
     * - Obtiene la lista completa de tareas, activas e inactivas.
     */
    getTasks: (): Promise<Task[]> => request<Task[]>('/tasks'),

    /**
     * ----------------------------------------
     * -----  `createTask(dto)`  -----
     * ----------------------------------------
     * - Crea una nueva tarea en la API.
     */
    createTask: (dto: CreateTaskDto): Promise<Task> =>
        request<Task>('/tasks', { method: 'POST', body: JSON.stringify(dto) }),

    /**
     * ------------------------------------------------
     * -----  `updateTask(id, dto)`  -----
     * ------------------------------------------------
     * - Actualiza una tarea existente por su identificador.
     */
    updateTask: (id: string, dto: UpdateTaskDto): Promise<Task> =>
        request<Task>(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    /**
     * ----------------------------------------
     * -----  `deleteTask(id)`  -----
     * ----------------------------------------
     * - Elimina una tarea por su identificador.
     */
    deleteTask: (id: string): Promise<void> =>
        request<void>(`/tasks/${id}`, { method: 'DELETE' }),

    /**
     * ------------------------------------------------------
     * -----  `createSubtask(taskId, dto)`  -----
     * ------------------------------------------------------
     * - Crea una subtarea asociada a una tarea existente.
     */
    createSubtask: (taskId: string, dto: CreateSubtaskDto): Promise<Subtask> =>
        request<Subtask>(`/tasks/${taskId}/subtasks`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    /**
     * ------------------------------------------------------------------
     * -----  `updateSubtask(taskId, subtaskId, dto)`  -----
     * ------------------------------------------------------------------
     * - Actualiza una subtarea concreta dentro de una tarea.
     */
    updateSubtask: (
        taskId: string,
        subtaskId: string,
        dto: UpdateSubtaskDto,
    ): Promise<Subtask> =>
        request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    /**
     * --------------------------------------------------------------
     * -----  `deleteSubtask(taskId, subtaskId)`  -----
     * --------------------------------------------------------------
     * - Elimina una subtarea concreta dentro de una tarea.
     */
    deleteSubtask: (taskId: string, subtaskId: string): Promise<void> =>
        request<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'DELETE',
        }),

    /**
     * ------------------------------------------
     * -----  `getEntries(filter)`  -----
     * ------------------------------------------
     * - Obtiene los registros de tiempo según el filtro recibido.
     */
    getEntries: (
        filter: {
            date?: string;
            from?: string;
            to?: string;
            taskId?: string;
            subtaskId?: string;
        } = {},
    ): Promise<TimeEntryView[]> => request<TimeEntryView[]>(`/entries${query(filter)}`),

    /**
     * ------------------------------------------
     * -----  `createEntry(dto)`  -----
     * ------------------------------------------
     * - Crea un nuevo registro de tiempo en la API.
     */
    createEntry: (dto: CreateTimeEntryDto): Promise<TimeEntryView> =>
        request<TimeEntryView>('/entries', {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    /**
     * ----------------------------------------------
     * -----  `updateEntry(id, dto)`  -----
     * ----------------------------------------------
     * - Actualiza un registro de tiempo por su identificador.
     */
    updateEntry: (
        id: string,
        dto: UpdateTimeEntryDto,
    ): Promise<TimeEntryView> =>
        request<TimeEntryView>(`/entries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }),

    /**
     * ------------------------------------------
     * -----  `deleteEntry(id)`  -----
     * ------------------------------------------
     * - Elimina un registro de tiempo por su identificador.
     */
    deleteEntry: (id: string): Promise<void> =>
        request<void>(`/entries/${id}`, { method: 'DELETE' }),

    /**
     * ------------------------------------------
     * -----  `getSummary(range)`  -----
     * ------------------------------------------
     * - Obtiene el resumen del informe para el rango indicado.
     */
    getSummary: (
        range: { from?: string; to?: string; month?: string } = {},
    ): Promise<ReportSummary> => request<ReportSummary>(`/reports/summary${query(range)}`),

    /**
     * ------------------------------------
     * -----  `getStats(date)`  -----
     * ------------------------------------
     * - Obtiene las estadísticas asociadas a una fecha concreta.
     */
    getStats: (date?: string): Promise<StatsSummary> =>
        request<StatsSummary>(`/reports/stats${query({ date })}`),
};
