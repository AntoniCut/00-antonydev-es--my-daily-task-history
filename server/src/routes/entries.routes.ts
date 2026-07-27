/*
	*  -------------------------------------------------------------------------  *
	*  -----  entries.routes.ts  --  /server/src/routes/entries.routes.ts  -----  *
	*  -------------------------------------------------------------------------  *
*/
import { Router } from 'express';
import { entriesController } from '../controllers/entries.controller.js';

export const entriesRouter = Router();

entriesRouter.get('/', (req, res) => entriesController.list(req, res));
entriesRouter.post('/', (req, res) => entriesController.create(req, res));
entriesRouter.put('/:id', (req, res) => entriesController.update(req, res));
entriesRouter.delete('/:id', (req, res) => entriesController.delete(req, res));
