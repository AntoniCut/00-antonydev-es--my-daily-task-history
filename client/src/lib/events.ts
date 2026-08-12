/*
    *  ----------------------------------------------------------------------  *
    *  -----  events.ts  --  /client/src/lib/events.ts  -----  *
    *  ----------------------------------------------------------------------  *
*/

export const APP_EVENTS = {
    dataChanged: 'app:data-changed',
} as const;

/** Tipo de cambio que origina el evento `app:data-changed`. */
export type DataChangeType = 'entry' | 'task' | 'subtask' | 'task-status';

export interface DataChangeDetail {
    /** Tipo de cambio; si falta, se considera un cambio genérico. */
    type?: DataChangeType;
    /** Fecha del registro afectado (YYYY-MM-DD); solo para cambios `entry`. */
    date?: string;
}

/**
 * ------------------------------------
 * -----  `emitDataChanged(detail)`  -----
 * ------------------------------------
 * - Emite el evento global que notifica cambios en los datos.
 */
export const emitDataChanged = (detail: DataChangeDetail = {}): void => {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.dataChanged, { detail }));
};

/**
 * ----------------------------------------
 * -----  `dataChangeDetail(event)`  -----
 * ----------------------------------------
 * - Extrae el detalle tipado del evento de cambio de datos.
 */
export const dataChangeDetail = (event: Event): DataChangeDetail =>
    (event as CustomEvent<DataChangeDetail>).detail ?? {};

/**
 * ----------------------------------------
 * -----  `onDataChanged(handler, options)`  -----
 * ----------------------------------------
 * - Registra un listener para reaccionar cuando cambian los datos.
 */
export const onDataChanged = (
    handler: EventListener,
    options?: AddEventListenerOptions,
): void => {
    document.addEventListener(APP_EVENTS.dataChanged, handler, options);
};
