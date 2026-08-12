/*
    *  ------------------------------------------------------------------  *
    *  -----  time.ts  --  /client/src/lib/time.ts  -----  *
    *  ------------------------------------------------------------------  *
*/
export const MONTH_NAMES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
] as const;

export const WEEKDAY_NAMES = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
] as const;

/**
 * ----------------------------
 * -----  `pad(value)`  -----
 * ----------------------------
 * - Rellena con cero a la izquierda un valor numérico de una cifra.
 */
export const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * --------------------------------
 * -----  `toDateKey(date)`  -----
 * --------------------------------
 * - Convierte una fecha al formato de clave YYYY-MM-DD.
 */
export const toDateKey = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * -------------------------------
 * -----  `todayKey()`  -----
 * -------------------------------
 * - Devuelve la clave de fecha correspondiente al día actual.
 */
export const todayKey = (): string => toDateKey(new Date());

/**
 * ------------------------------------
 * -----  `parseDateKey(dateKey)`  -----
 * ------------------------------------
 * - Convierte una clave de fecha en una instancia de Date.
 */
export const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * ----------------------------------------
 * -----  `addDays(dateKey, days)`  -----
 * ----------------------------------------
 * - Suma o resta días a una clave de fecha y devuelve la nueva clave.
 */
export const addDays = (dateKey: string, days: number): string => {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};

/**
 * --------------------------------------------
 * -----  `formatDateLong(dateKey)`  -----
 * --------------------------------------------
 * - Formatea una fecha en un texto largo legible en español.
 */
export const formatDateLong = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return `${day} de ${MONTH_NAMES[month - 1].toLowerCase()} de ${year}`;
};

/**
 * ----------------------------------------------
 * -----  `formatDateShort(dateKey)`  -----
 * ----------------------------------------------
 * - Formatea una fecha en un texto corto con día y mes abreviado.
 */
export const formatDateShort = (dateKey: string): string => {
    const [, month, day] = dateKey.split('-').map(Number);
    return `${day} ${MONTH_NAMES[month - 1].slice(0, 3).toLowerCase()}`;
};

/**
 * ------------------------------------------
 * -----  `formatWeekday(dateKey)`  -----
 * ------------------------------------------
 * - Devuelve el nombre del día de la semana para una fecha.
 */
export const formatWeekday = (dateKey: string): string =>
    WEEKDAY_NAMES[(parseDateKey(dateKey).getDay() + 6) % 7];

/**
 * ------------------------------------------
 * -----  `formatMinutes(minutes)`  -----
 * ------------------------------------------
 * - Convierte minutos a un texto compacto y legible.
 */
export const formatMinutes = (minutes: number): string => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}m`;
    if (!rest) return `${hours}h`;
    return `${hours}h ${rest}m`;
};

/**
 * --------------------------------------
 * -----  `formatHours(minutes)`  -----
 * --------------------------------------
 * - Convierte minutos a horas decimales con dos decimales.
 */
export const formatHours = (minutes: number): string =>
    (minutes / 60).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
    });

export interface DateRange {
    from: string;
    to: string;
}

/**
 * ----------------------------------------
 * -----  `weekRange(dateKey)`  -----
 * ----------------------------------------
 * - Calcula el rango semanal de lunes a domingo para una fecha.
 */
export const weekRange = (dateKey: string = todayKey()): DateRange => {
    const weekday = (parseDateKey(dateKey).getDay() + 6) % 7;
    const from = addDays(dateKey, -weekday);
    return { from, to: addDays(from, 6) };
};

/**
 * ------------------------------------------
 * -----  `monthRange(dateKey)`  -----
 * ------------------------------------------
 * - Calcula el rango completo del mes para una fecha dada.
 */
export const monthRange = (dateKey: string = todayKey()): DateRange => {
    const [year, month] = dateKey.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
        from: `${year}-${pad(month)}-01`,
        to: `${year}-${pad(month)}-${pad(lastDay)}`,
    };
};

/**
 * ----------------------------------------
 * -----  `yearRange(dateKey)`  -----
 * ----------------------------------------
 * - Calcula el rango completo del año para una fecha dada.
 */
export const yearRange = (dateKey: string = todayKey()): DateRange => {
    const year = dateKey.slice(0, 4);
    return { from: `${year}-01-01`, to: `${year}-12-31` };
};

/**
 * ----------------------------------------
 * -----  `formatRange({ from, to })`  -----
 * ----------------------------------------
 * - Formatea un rango de fechas en texto legible para la interfaz.
 */
export const formatRange = ({ from, to }: DateRange): string =>
    from === to
        ? formatDateLong(from)
        : `${formatDateShort(from)} — ${formatDateShort(to)} de ${to.slice(0, 4)}`;

/**
 * ----------------------------------
 * -----  `currentTime()`  -----
 * ----------------------------------
 * - Devuelve la hora actual redondeada a bloques de cinco minutos.
 */
export const currentTime = (): string => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`;
};
