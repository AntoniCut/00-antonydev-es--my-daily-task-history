/*
	*  -------------------------------------------------------------------------  *
	*  -----  reports.routes.ts  --  /server/src/routes/reports.routes.ts  -----  *
	*  -------------------------------------------------------------------------  *
*/
import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

reportsRouter.get('/summary', (req, res) => reportsController.summary(req, res));
reportsRouter.get('/days', (req, res) => reportsController.days(req, res));
reportsRouter.get('/stats', (req, res) => reportsController.stats(req, res));
