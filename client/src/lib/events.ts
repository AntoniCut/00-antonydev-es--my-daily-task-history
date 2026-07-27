/*
 *  ------------------------------------------------------  *
 *  -----  events.ts  --  /client/src/lib/events.ts  -----  *
 *  ------------------------------------------------------  *
 */

/** Eventos personalizados para la comunicación entre componentes. */
export const APP_EVENTS = {
    /** Se ha seleccionado un día en el calendario */
    dateSelected: 'app:date-selected',
    /** Han cambiado tareas, subtareas o registros de tiempo */
    dataChanged: 'app:data-changed',
} as const;

export const emitDateSelected = (date: string): void => {
    document.dispatchEvent(
        new CustomEvent<string>(APP_EVENTS.dateSelected, { detail: date }),
    );
};

export const emitDataChanged = (): void => {
    document.dispatchEvent(new CustomEvent(APP_EVENTS.dataChanged));
};

export const onDateSelected = (
    handler: (date: string) => void,
    options?: AddEventListenerOptions,
): void => {
    document.addEventListener(
        APP_EVENTS.dateSelected,
        (event) => handler((event as CustomEvent<string>).detail),
        options,
    );
};

export const onDataChanged = (
    handler: () => void,
    options?: AddEventListenerOptions,
): void => {
    document.addEventListener(APP_EVENTS.dataChanged, handler, options);
};
