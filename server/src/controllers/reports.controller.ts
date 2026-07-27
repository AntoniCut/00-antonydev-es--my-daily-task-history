/*
	*  --------------------------------------------------------------------------------------  *
	*  -----  reports.controller.ts  --  /server/src/controllers/reports.controller.ts  -----  *
	*  --------------------------------------------------------------------------------------  *
*/
import type { Request, Response } from 'express';
import { reportsService } from '../services/reports.service.js';
import { isDateKey, isMonthKey, monthRange } from '../utils/time.js';

const dateParam = (value: unknown): string | undefined =>
  isDateKey(value) ? value : undefined;

export class ReportsController {
  async summary(req: Request, res: Response): Promise<void> {
    const { from, to } = resolveRange(req);
    res.json(await reportsService.summary(from, to));
  }

  async days(req: Request, res: Response): Promise<void> {
    const { from, to } = resolveRange(req);
    res.json(await reportsService.days(from, to));
  }

  async stats(req: Request, res: Response): Promise<void> {
    res.json(await reportsService.stats(dateParam(req.query.date)));
  }
}

/** Acepta `?month=YYYY-MM` o `?from=&to=` (ambos opcionales). */
const resolveRange = (req: Request): { from?: string; to?: string } => {
  const month = req.query.month;
  if (isMonthKey(month)) {
    return monthRange(`${month}-01`);
  }
  return { from: dateParam(req.query.from), to: dateParam(req.query.to) };
};

export const reportsController = new ReportsController();
