/*
    *  -------------------------------------------------------------------------  *
    *  -----  entries.routes.ts  --  /server/src/routes/entries.routes.ts  -----  *
    *  -------------------------------------------------------------------------  *
*/
import { Router, type Request, type Response } from 'express';
import { entriesController } from '../controllers/entries.controller.js';

export const entriesRouter = Router();

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para listar registros de tiempo.
 */
entriesRouter.get('/', (req: Request, res: Response): Promise<void> =>
    entriesController.list(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para crear un registro de tiempo.
 */
entriesRouter.post('/', (req: Request, res: Response): Promise<void> =>
    entriesController.create(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para actualizar un registro de tiempo.
 */
entriesRouter.put('/:id', (req: Request, res: Response): Promise<void> =>
    entriesController.update(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para eliminar un registro de tiempo.
 */
entriesRouter.delete('/:id', (req: Request, res: Response): Promise<void> =>
    entriesController.delete(req, res),
);
