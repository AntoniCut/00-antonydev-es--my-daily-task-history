/*
	*  ---------------------------------------------------------------------  *
	*  -----  tasks.routes.ts  --  /server/src/routes/tasks.routes.ts  -----  *
	*  ---------------------------------------------------------------------  *
*/
import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req, res) => tasksController.getAll(req, res));
tasksRouter.get('/dates', (req, res) => tasksController.getDates(req, res));
tasksRouter.get('/:id', (req, res) => tasksController.getById(req, res));
tasksRouter.post('/', (req, res) => tasksController.create(req, res));
tasksRouter.put('/:id', (req, res) => tasksController.update(req, res));
tasksRouter.delete('/:id', (req, res) => tasksController.delete(req, res));
