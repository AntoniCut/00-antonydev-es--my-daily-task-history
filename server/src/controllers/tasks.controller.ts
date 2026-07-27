/*
	*  ----------------------------------------------------------------------------------  *
	*  -----  tasks.controller.ts  --  /server/src/controllers/tasks.controller.ts  -----  *
	*  ----------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { tasksService } from '../services/tasks.service.js';
import type { CreateTaskDto, UpdateTaskDto } from '../types/task.js';

export class TasksController {
  async getAll(req: Request, res: Response): Promise<void> {
    const date = req.query.date as string | undefined;
    const tasks = await tasksService.getAll(date);
    res.json(tasks);
  }

  async getDates(req: Request, res: Response): Promise<void> {
    const month = req.query.month as string | undefined;
    const dates = await tasksService.getDatesWithTasks(month);
    res.json(dates);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const task = await tasksService.getById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(task);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const task = await tasksService.create(req.body as CreateTaskDto);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const task = await tasksService.update(req.params.id, req.body as UpdateTaskDto);
      if (!task) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const deleted = await tasksService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.status(204).send();
  }
}

export const tasksController = new TasksController();
