/*
    *  ----------------------------------------------------------------------  *
    *  -----  events.ts  --  /client/src/lib/events.ts  -----  *
    *  ----------------------------------------------------------------------  *
*/

export const APP_EVENTS = {
    dataChanged: 'app:data-changed',
} as const;

/**
 * ------------------------------------
 * -----  `emitDataChanged()`  -----
 * ------------------------------------
 * - Emite el evento global que notifica cambios en los datos.
 */
export const emitDataChanged = (): void => {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.dataChanged));
};

/**
 * ----------------------------------------
 * -----  `onDataChanged(handler, options)`  -----
 * ----------------------------------------
 * - Registra un listener para reaccionar cuando cambian los datos.
 */
export const onDataChanged = (
    handler: () => void,
    options?: AddEventListenerOptions,
): void => {
    document.addEventListener(APP_EVENTS.dataChanged, handler, options);
};
