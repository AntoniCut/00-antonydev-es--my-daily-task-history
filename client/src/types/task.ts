export interface Task {
  id: string;
  title: string;
  description?: string;
  /** Fecha de la tarea en formato "YYYY-MM-DD" */
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  date: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  date?: string;
  completed?: boolean;
}
