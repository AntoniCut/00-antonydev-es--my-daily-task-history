import type { CreateTaskDto, Task, UpdateTaskDto } from '../types/task';

const API_URL = import.meta.env.PUBLIC_API_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Error ${response.status} al llamar a la API`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  getTasks(date?: string): Promise<Task[]> {
    const query = date ? `?date=${date}` : '';
    return request<Task[]>(`/tasks${query}`);
  },

  getDatesWithTasks(month: string): Promise<string[]> {
    return request<string[]>(`/tasks/dates?month=${month}`);
  },

  createTask(dto: CreateTaskDto): Promise<Task> {
    return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(dto) });
  },

  updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
  },

  deleteTask(id: string): Promise<void> {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
