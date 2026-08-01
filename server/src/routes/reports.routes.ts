/*
    *  -------------------------------------------------------------------------  *
    *  -----  reports.routes.ts  --  /server/src/routes/reports.routes.ts  -----  *
    *  -------------------------------------------------------------------------  *
*/
import { Router, type Request, type Response } from 'express';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta del resumen de reportes.
 */
reportsRouter.get('/summary', (req: Request, res: Response): Promise<void> =>
    reportsController.summary(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta de totales diarios.
 */
reportsRouter.get('/days', (req: Request, res: Response): Promise<void> =>
    reportsController.days(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta de estadisticas del dashboard.
 */
reportsRouter.get('/stats', (req: Request, res: Response): Promise<void> =>
    reportsController.stats(req, res),
);
