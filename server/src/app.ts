/*
	*  --------------------------------------------  *
	*  -----  app.ts  --  /server/src/app.ts  -----  *
	*  --------------------------------------------  *
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes.js';
import { entriesRouter } from './routes/entries.routes.js';
import { reportsRouter } from './routes/reports.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/tasks', tasksRouter);
  app.use('/api/entries', entriesRouter);
  app.use('/api/reports', reportsRouter);

  // Tras el build, sirve el frontend estático en el mismo origen que la API
  // (así /api no da 404 en preview/producción, a diferencia de `astro preview`).
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
