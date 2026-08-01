/*
    *  --------------------------------------------------------------------------------------  *
    *  -----  reports.controller.ts  --  /server/src/controllers/reports.controller.ts  -----  *
    *  --------------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { reportsService } from '../services/reports.service.js';
import { isDateKey, isMonthKey, monthRange } from '../utils/time.js';

/**
 * ---------------------------
 * -----  `dateParam()`  -----
 * ---------------------------
 * - Devuelve un parametro de fecha solo si tiene un formato valido.
 */
const dateParam = (value: unknown): string | undefined =>
    isDateKey(value) ? value : undefined;

export class ReportsController {
    /**
     * -------------------------
     * -----  `summary()`  -----
     * -------------------------
     * - Responde el resumen agregado de tiempo por tareas y subtareas.
     */
    async summary(req: Request, res: Response): Promise<void> {
        const { from, to } = resolveRange(req);
        res.json(await reportsService.summary(from, to));
    }

    /**
     * ----------------------
     * -----  `days()`  -----
     * ----------------------
     * - Responde los totales diarios dentro del rango solicitado.
     */
    async days(req: Request, res: Response): Promise<void> {
        const { from, to } = resolveRange(req);
        res.json(await reportsService.days(from, to));
    }

    /**
     * -----------------------
     * -----  `stats()`  -----
     * -----------------------
     * - Responde las estadisticas principales del dashboard.
     */
    async stats(req: Request, res: Response): Promise<void> {
        res.json(await reportsService.stats(dateParam(req.query.date)));
    }
}

/**
 * ------------------------------
 * -----  `resolveRange()`  -----
 * ------------------------------
 * - Resuelve un rango de fechas a partir de los parametros de la peticion.
 */
const resolveRange = (req: Request): { from?: string; to?: string } => {
    const month = req.query.month;
    if (isMonthKey(month)) {
        return monthRange(`${month}-01`);
    }

    return { from: dateParam(req.query.from), to: dateParam(req.query.to) };
};

export const reportsController = new ReportsController();
