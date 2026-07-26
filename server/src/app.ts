import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/tasks', tasksRouter);

  return app;
}
