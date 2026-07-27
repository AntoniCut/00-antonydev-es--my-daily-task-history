/*
	*  -----------------------------------------------------------------------------  *
	*  -----  reports.service.ts  --  /server/src/services/reports.service.ts  -----  *
	*  -----------------------------------------------------------------------------  *
*/
import { jsonStorage } from '../storage/jsonStorage.js';
import { flattenEntries } from '../utils/entries.js';
import {
  isWithinRange,
  monthRange,
  todayKey,
  weekRange,
} from '../utils/time.js';
import type {
  DayTotal,
  ReportSummary,
  StatsSummary,
  SubtaskReport,
  Task,
  TaskReport,
  TimeEntry,
} from '../types/task.js';

const sumMinutes = (
  entries: TimeEntry[],
  from?: string,
  to?: string,
): { minutes: number; count: number } => {
  let minutes = 0;
  let count = 0;
  for (const entry of entries) {
    if (!isWithinRange(entry.date, from, to)) continue;
    minutes += entry.minutes;
    count += 1;
  }
  return { minutes, count };
};

export class ReportsService {
  /** Tiempo invertido por tarea y subtarea dentro de un rango de fechas. */
  async summary(from?: string, to?: string): Promise<ReportSummary> {
    const tasks = await jsonStorage.readAll();

    const taskReports: TaskReport[] = tasks.map((task) => {
      const own = sumMinutes(task.entries, from, to);
      const subtasks: SubtaskReport[] = task.subtasks.map((subtask) => {
        const totals = sumMinutes(subtask.entries, from, to);
        return {
          id: subtask.id,
          title: subtask.title,
          active: subtask.active,
          minutes: totals.minutes,
          entries: totals.count,
        };
      });

      const minutes =
        own.minutes + subtasks.reduce((total, item) => total + item.minutes, 0);
      const entries =
        own.count + subtasks.reduce((total, item) => total + item.entries, 0);

      return {
        id: task.id,
        title: task.title,
        color: task.color,
        active: task.active,
        directMinutes: own.minutes,
        minutes,
        entries,
        subtasks: subtasks.sort((a, b) => b.minutes - a.minutes),
      };
    });

    return {
      from,
      to,
      totalMinutes: taskReports.reduce((total, task) => total + task.minutes, 0),
      days: this.dayTotals(tasks, from, to),
      tasks: taskReports.sort(
        (a, b) => b.minutes - a.minutes || a.title.localeCompare(b.title),
      ),
    };
  }

  /** Totales por día, usados por el calendario y las gráficas. */
  async days(from?: string, to?: string): Promise<DayTotal[]> {
    const tasks = await jsonStorage.readAll();
    return this.dayTotals(tasks, from, to);
  }

  /** Contadores de cabecera del dashboard: hoy, semana y mes en curso. */
  async stats(date = todayKey()): Promise<StatsSummary> {
    const tasks = await jsonStorage.readAll();
    const entries = flattenEntries(tasks);
    const week = weekRange(date);
    const month = monthRange(date);

    const total = (from: string, to: string): number =>
      entries
        .filter((entry) => isWithinRange(entry.date, from, to))
        .reduce((sum, entry) => sum + entry.minutes, 0);

    const activeTasks = tasks.filter((task) => task.active);

    return {
      date,
      todayMinutes: total(date, date),
      weekMinutes: total(week.from, week.to),
      monthMinutes: total(month.from, month.to),
      weekFrom: week.from,
      weekTo: week.to,
      monthFrom: month.from,
      monthTo: month.to,
      activeTasks: activeTasks.length,
      activeSubtasks: activeTasks.reduce(
        (count, task) => count + task.subtasks.filter((sub) => sub.active).length,
        0,
      ),
    };
  }

  private dayTotals(tasks: Task[], from?: string, to?: string): DayTotal[] {
    const totals = new Map<string, number>();
    for (const entry of flattenEntries(tasks)) {
      if (!isWithinRange(entry.date, from, to)) continue;
      totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.minutes);
    }
    return [...totals.entries()]
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const reportsService = new ReportsService();
