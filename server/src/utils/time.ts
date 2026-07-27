/*
	*  ----------------------------------------------------  *
	*  -----  time.ts  --  /server/src/utils/time.ts  -----  *
	*  ----------------------------------------------------  *
*/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const MINUTES_PER_DAY = 24 * 60;

const pad = (value: number): string => String(value).padStart(2, '0');

export const isDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const isMonthKey = (value: unknown): value is string =>
  typeof value === 'string' && MONTH_REGEX.test(value);

export const isTimeKey = (value: unknown): value is string =>
  typeof value === 'string' && TIME_REGEX.test(value);

const toMinutesOfDay = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Minutos entre dos horas "HH:MM". Si la hora final es anterior a la inicial se
 * asume que el tramo cruza la medianoche (turnos de noche).
 */
export const durationInMinutes = (start: string, end: string): number => {
  const from = toMinutesOfDay(start);
  const to = toMinutesOfDay(end);
  return to > from ? to - from : to + MINUTES_PER_DAY - from;
};

export const todayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const addDays = (dateKey: string, days: number): string => {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
};

/** Rango [lunes, domingo] de la semana a la que pertenece la fecha. */
export const weekRange = (dateKey: string): { from: string; to: string } => {
  const weekday = (parseDateKey(dateKey).getUTCDay() + 6) % 7;
  const from = addDays(dateKey, -weekday);
  return { from, to: addDays(from, 6) };
};

/** Rango [primer día, último día] del mes al que pertenece la fecha. */
export const monthRange = (dateKey: string): { from: string; to: string } => {
  const [year, month] = dateKey.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
};

export const isWithinRange = (
  dateKey: string,
  from?: string,
  to?: string,
): boolean => {
  if (from && dateKey < from) return false;
  if (to && dateKey > to) return false;
  return true;
};
