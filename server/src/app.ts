/*
    *  --------------------------------------------  *
    *  -----  app.ts  --  /server/src/app.ts  -----  *
    *  --------------------------------------------  *
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes.js';
import { entriesRouter } from './routes/entries.routes.js';
import { reportsRouter } from './routes/reports.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Busca `client/dist` subiendo desde este archivo (vale en `src/` y en `dist/`).
 */
const resolveClientDist = (): string => {
    let dir = __dirname;
    for (let i = 0; i < 8; i++) {
        const candidate = path.join(dir, 'client', 'dist');
        if (fs.existsSync(path.join(candidate, 'index.html'))) {
            return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return path.resolve(__dirname, '../../client/dist');
};

export const clientDist = resolveClientDist();

/**
 * ---------------------------
 * -----  `createApp()`  -----
 * ---------------------------
 * - Crea y configura la aplicacion Express del servidor.
 */
export const createApp = (): Express => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    /**
     * -------------------------
     * -----  `handler()`  -----
     * -------------------------
     * - Responde el endpoint de salud de la API.
     */
    app.get('/api/health', (_req: Request, res: Response): void => {
        res.json({ status: 'ok' });
    });

    app.use('/api/tasks', tasksRouter);
    app.use('/api/entries', entriesRouter);
    app.use('/api/reports', reportsRouter);

    // Tras el build, sirve el frontend estatico en el mismo origen que la API
    // (asi /api no da 404 en preview/produccion, a diferencia de `astro preview`).
    if (fs.existsSync(clientDist)) {
        app.use(express.static(clientDist));

        /**
         * -------------------------
         * -----  `handler()`  -----
         * -------------------------
         * - Sirve el index del cliente para rutas que no pertenecen a la API.
         */
        app.get(/^(?!\/api).*/, (_req: Request, res: Response): void => {
            res.sendFile(path.join(clientDist, 'index.html'));
        });
    }

    return app;
};
