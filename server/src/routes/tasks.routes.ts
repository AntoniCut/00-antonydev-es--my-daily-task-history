/*
    *  ---------------------------------------------------------------------  *
    *  -----  tasks.routes.ts  --  /server/src/routes/tasks.routes.ts  -----  *
    *  ---------------------------------------------------------------------  *
*/
import { Router, type Request, type Response } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';

export const tasksRouter = Router();

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para listar tareas.
 */
tasksRouter.get('/', (req: Request, res: Response): Promise<void> =>
    tasksController.getAll(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para consultar una tarea por id.
 */
tasksRouter.get('/:id', (req: Request, res: Response): Promise<void> =>
    tasksController.getById(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para crear una tarea.
 */
tasksRouter.post('/', (req: Request, res: Response): Promise<void> =>
    tasksController.create(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para actualizar una tarea.
 */
tasksRouter.put('/:id', (req: Request, res: Response): Promise<void> =>
    tasksController.update(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para eliminar una tarea.
 */
tasksRouter.delete('/:id', (req: Request, res: Response): Promise<void> =>
    tasksController.delete(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para crear una subtarea.
 */
tasksRouter.post('/:taskId/subtasks', (req: Request, res: Response): Promise<void> =>
    tasksController.addSubtask(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para actualizar una subtarea.
 */
tasksRouter.put(
    '/:taskId/subtasks/:subtaskId',
    (req: Request, res: Response): Promise<void> => tasksController.updateSubtask(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para eliminar una subtarea.
 */
tasksRouter.delete(
    '/:taskId/subtasks/:subtaskId',
    (req: Request, res: Response): Promise<void> => tasksController.deleteSubtask(req, res),
);
