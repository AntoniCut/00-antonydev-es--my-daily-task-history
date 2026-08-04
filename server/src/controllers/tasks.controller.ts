/*
    *  ----------------------------------------------------------------------------------  *
    *  -----  tasks.controller.ts  --  /server/src/controllers/tasks.controller.ts  -----  *
    *  ----------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { tasksService } from '../services/tasks.service.js';
import type {
    CreateSubtaskDto,
    CreateTaskDto,
    UpdateSubtaskDto,
    UpdateTaskDto,
} from '../types/types.js';

const NOT_FOUND_TASK = 'Tarea no encontrada';
const NOT_FOUND_SUBTASK = 'Subtarea no encontrada';

export class TasksController {
    /**
     * ------------------------
     * -----  `getAll()`  -----
     * ------------------------
     * - Lista las tareas y permite incluir o excluir las inactivas.
     */
    async getAll(req: Request, res: Response): Promise<void> {
        const includeInactive = req.query.includeInactive !== 'false';
        res.json(await tasksService.getAll(includeInactive));
    }

    /**
     * -------------------------
     * -----  `getById()`  -----
     * -------------------------
     * - Devuelve una tarea concreta si existe.
     */
    async getById(req: Request, res: Response): Promise<void> {
        const task = await tasksService.getById(req.params.id);
        if (!task) {
            res.status(404).json({ error: NOT_FOUND_TASK });
            return;
        }

        res.json(task);
    }

    /**
     * ------------------------
     * -----  `create()`  -----
     * ------------------------
     * - Crea una tarea nueva con los datos enviados por el cliente.
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const task = await tasksService.create(req.body as CreateTaskDto);
            res.status(201).json(task);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * ------------------------
     * -----  `update()`  -----
     * ------------------------
     * - Actualiza una tarea existente y responde con su estado actual.
     */
    async update(req: Request, res: Response): Promise<void> {
        try {
            const task = await tasksService.update(
                req.params.id,
                req.body as UpdateTaskDto,
            );

            if (!task) {
                res.status(404).json({ error: NOT_FOUND_TASK });
                return;
            }

            res.json(task);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * ------------------------
     * -----  `delete()`  -----
     * ------------------------
     * - Elimina una tarea del almacenamiento.
     */
    async delete(req: Request, res: Response): Promise<void> {
        const deleted = await tasksService.delete(req.params.id);
        if (!deleted) {
            res.status(404).json({ error: NOT_FOUND_TASK });
            return;
        }

        res.status(204).send();
    }

    /**
     * ----------------------------
     * -----  `addSubtask()`  -----
     * ----------------------------
     * - Crea una subtarea dentro de la tarea indicada.
     */
    async addSubtask(req: Request, res: Response): Promise<void> {
        try {
            const subtask = await tasksService.addSubtask(
                req.params.taskId,
                req.body as CreateSubtaskDto,
            );

            if (!subtask) {
                res.status(404).json({ error: NOT_FOUND_TASK });
                return;
            }

            res.status(201).json(subtask);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * -------------------------------
     * -----  `updateSubtask()`  -----
     * -------------------------------
     * - Actualiza una subtarea concreta dentro de una tarea.
     */
    async updateSubtask(req: Request, res: Response): Promise<void> {
        try {
            const subtask = await tasksService.updateSubtask(
                req.params.taskId,
                req.params.subtaskId,
                req.body as UpdateSubtaskDto,
            );

            if (!subtask) {
                res.status(404).json({ error: NOT_FOUND_SUBTASK });
                return;
            }

            res.json(subtask);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * -------------------------------
     * -----  `deleteSubtask()`  -----
     * -------------------------------
     * - Elimina una subtarea de la tarea indicada.
     */
    async deleteSubtask(req: Request, res: Response): Promise<void> {
        const deleted = await tasksService.deleteSubtask(
            req.params.taskId,
            req.params.subtaskId,
        );

        if (!deleted) {
            res.status(404).json({ error: NOT_FOUND_SUBTASK });
            return;
        }

        res.status(204).send();
    }
}

export const tasksController = new TasksController();
