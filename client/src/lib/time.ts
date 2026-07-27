/*
 *  --------------------------------------------------  *
 *  -----  time.ts  --  /client/src/lib/time.ts  -----  *
 *  --------------------------------------------------  *
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

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateKey = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayKey = (): string => toDateKey(new Date());

export const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const addDays = (dateKey: string, days: number): string => {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};

/** "27 de julio de 2026" */
export const formatDateLong = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return `${day} de ${MONTH_NAMES[month - 1].toLowerCase()} de ${year}`;
};

/** "27 jul" */
export const formatDateShort = (dateKey: string): string => {
    const [, month, day] = dateKey.split('-').map(Number);
    return `${day} ${MONTH_NAMES[month - 1].slice(0, 3).toLowerCase()}`;
};

export const formatWeekday = (dateKey: string): string =>
    WEEKDAY_NAMES[(parseDateKey(dateKey).getDay() + 6) % 7];

/** Minutos a texto legible: 0m, 45m, 2h, 2h 30m */
export const formatMinutes = (minutes: number): string => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}m`;
    if (!rest) return `${hours}h`;
    return `${hours}h ${rest}m`;
};

/** Minutos a decimal con dos decimales, útil para facturar: 2,5 h */
export const formatHours = (minutes: number): string =>
    (minutes / 60).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export interface DateRange {
    from: string;
    to: string;
}

/** Rango [lunes, domingo] de la semana de `dateKey`. */
export const weekRange = (dateKey: string = todayKey()): DateRange => {
    const weekday = (parseDateKey(dateKey).getDay() + 6) % 7;
    const from = addDays(dateKey, -weekday);
    return { from, to: addDays(from, 6) };
};

/** Rango [día 1, último día] del mes de `dateKey`. */
export const monthRange = (dateKey: string = todayKey()): DateRange => {
    const [year, month] = dateKey.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
        from: `${year}-${pad(month)}-01`,
        to: `${year}-${pad(month)}-${pad(lastDay)}`,
    };
};

/** Rango [1 de enero, 31 de diciembre] del año de `dateKey`. */
export const yearRange = (dateKey: string = todayKey()): DateRange => {
    const year = dateKey.slice(0, 4);
    return { from: `${year}-01-01`, to: `${year}-12-31` };
};

export const formatRange = ({ from, to }: DateRange): string =>
    from === to
        ? formatDateLong(from)
        : `${formatDateShort(from)} — ${formatDateShort(to)} de ${to.slice(0, 4)}`;

/** Hora actual redondeada a la baja en tramos de 5 minutos ("HH:MM"). */
export const currentTime = (): string => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`;
};
