/*
    *  --------------------------------------------------------------------------------------  *
    *  -----  entries.controller.ts  --  /server/src/controllers/entries.controller.ts  -----  *
    *  --------------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { entriesService } from '../services/entries.service.js';
import type { CreateTimeEntryDto, UpdateTimeEntryDto } from '../types/types.js';

const NOT_FOUND = 'Registro de tiempo no encontrado';

/**
 * ----------------------------
 * -----  `queryValue()`  -----
 * ----------------------------
 * - Extrae un valor de consulta solo si llega como texto no vacio.
 */
const queryValue = (value: unknown): string | undefined =>
    typeof value === 'string' && value ? value : undefined;

export class EntriesController {
    /**
     * ----------------------
     * -----  `list()`  -----
     * ----------------------
     * - Lista los registros de tiempo filtrando por los parametros disponibles.
     */
    async list(req: Request, res: Response): Promise<void> {
        const entries = await entriesService.list({
            from: queryValue(req.query.from),
            to: queryValue(req.query.to),
            date: queryValue(req.query.date),
            taskId: queryValue(req.query.taskId),
            subtaskId: queryValue(req.query.subtaskId),
        });

        res.json(entries);
    }

    /**
     * ------------------------
     * -----  `create()`  -----
     * ------------------------
     * - Crea un registro de tiempo y responde con su vista enriquecida.
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const entry = await entriesService.create(req.body as CreateTimeEntryDto);
            if (!entry) {
                res.status(404).json({ error: 'Tarea o subtarea no encontrada' });
                return;
            }

            res.status(201).json(entry);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * ------------------------
     * -----  `update()`  -----
     * ------------------------
     * - Actualiza un registro de tiempo existente.
     */
    async update(req: Request, res: Response): Promise<void> {
        try {
            const entry = await entriesService.update(
                req.params.id,
                req.body as UpdateTimeEntryDto,
            );

            if (!entry) {
                res.status(404).json({ error: NOT_FOUND });
                return;
            }

            res.json(entry);
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    /**
     * ------------------------
     * -----  `delete()`  -----
     * ------------------------
     * - Elimina un registro de tiempo del almacenamiento.
     */
    async delete(req: Request, res: Response): Promise<void> {
        const deleted = await entriesService.delete(req.params.id);
        if (!deleted) {
            res.status(404).json({ error: NOT_FOUND });
            return;
        }

        res.status(204).send();
    }
}

export const entriesController = new EntriesController();
