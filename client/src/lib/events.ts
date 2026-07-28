/*
 *  ------------------------------------------------------  *
 *  -----  events.ts  --  /client/src/lib/events.ts  -----  *
 *  ------------------------------------------------------  *
 */

/** Eventos personalizados para la comunicación entre componentes. */
export const APP_EVENTS = {
    /** Han cambiado tareas, subtareas o registros de tiempo */
    dataChanged: 'app:data-changed',
} as const;

export const emitDataChanged = (): void => {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.dataChanged));
};

export const onDataChanged = (
    handler: () => void,
    options?: AddEventListenerOptions,
): void => {
    document.addEventListener(APP_EVENTS.dataChanged, handler, options);
};
