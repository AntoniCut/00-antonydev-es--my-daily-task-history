/*
    *  --------------------------------------------------------------------------  *
    *  -----  draggable.ts  --  /client/src/lib/draggable.ts  -----  *
    *  --------------------------------------------------------------------------  *
*/

export interface DraggableOptions {
    /** Solo se inicia el drag desde este selector (p. ej. un asa). */
    handle?: string;
    /** Clave de localStorage para recordar la posición. */
    storageKey?: string;
    /** Señal para limpiar listeners al cambiar de página. */
    signal?: AbortSignal;
}

/**
 * ----------------------------------------
 * -----  `clamp(value, min, max)`  -----
 * ----------------------------------------
 * - Limita un valor numérico dentro de un rango mínimo y máximo.
 */
const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

/**
 * --------------------------------
 * -----  `readSaved(key)`  -----
 * --------------------------------
 * - Recupera una posición guardada válida desde localStorage.
 */
const readSaved = (key: string): { x: number; y: number } | null => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return { x: parsed.x, y: parsed.y };
        }
    } catch {
        /* ignore */
    }
    return null;
};

/**
 * ----------------------------------------
 * -----  `placeFixed(el, x, y)`  -----
 * ----------------------------------------
 * - Coloca un elemento fijo dentro de los límites visibles del viewport.
 */
export const placeFixed = (el: HTMLElement, x: number, y: number): void => {
    const maxX = Math.max(0, window.innerWidth - el.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - el.offsetHeight);

    el.style.position = 'fixed';
    el.style.left = `${clamp(x, 0, maxX)}px`;
    el.style.top = `${clamp(y, 0, maxY)}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.margin = '0';
    el.style.zIndex = '50';
};

/**
 * ----------------------------------------------
 * -----  `dockFixed(el, host, storageKey)`  -----
 * ----------------------------------------------
 * - Ancla un elemento flotante al host o restaura su posición guardada.
 */
export const dockFixed = (
    el: HTMLElement,
    host: HTMLElement,
    storageKey?: string,
): void => {
    if (storageKey) {
        const saved = readSaved(storageKey);
        if (saved) {
            placeFixed(el, saved.x, saved.y);
            return;
        }
    }
    const rect = host.getBoundingClientRect();
    placeFixed(el, rect.left, rect.top);
};

/**
 * ----------------------------------------------
 * -----  `makeDraggable(el, options)`  -----
 * ----------------------------------------------
 * - Activa el arrastre libre de un elemento fijo y devuelve su limpieza.
 */
export const makeDraggable = (
    el: HTMLElement,
    options: DraggableOptions = {},
): (() => void) => {
    const { handle, storageKey, signal } = options;
    const local = new AbortController();

    const source = handle
        ? el.querySelector<HTMLElement>(handle)
        : el;

    /**
     * ----------------------------
     * -----  `cleanup()`  -----
     * ----------------------------
     * - Elimina los listeners locales y limpia el estado visual del arrastre.
     */
    const cleanup = (): void => {
        if (!local.signal.aborted) {
            local.abort();
        }
        el.classList.remove('is-draggable', 'is-dragging');
        if (source) {
            source.style.touchAction = '';
        }
    };

    if (!source) {
        console.warn('[draggable] No se encontró el asa:', handle);
        return cleanup;
    }

    if (signal?.aborted) {
        return cleanup;
    }

    signal?.addEventListener('abort', cleanup, { once: true });

    el.classList.add('is-draggable');
    source.style.touchAction = 'none';

    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let pointerId: number | null = null;

    /**
     * --------------------------------------------
     * -----  `onPointerMove(event)`  -----
     * --------------------------------------------
     * - Reubica el elemento mientras el puntero mantiene activo el arrastre.
     */
    const onPointerMove = (event: PointerEvent): void => {
        if (!dragging || event.pointerId !== pointerId) {
            return;
        }

        placeFixed(el, event.clientX - offsetX, event.clientY - offsetY);
    };

    /**
     * --------------------------------------
     * -----  `stopDrag(event)`  -----
     * --------------------------------------
     * - Finaliza el arrastre activo y persiste la posición si corresponde.
     */
    const stopDrag = (event: PointerEvent): void => {
        if (!dragging || event.pointerId !== pointerId) {
            return;
        }

        dragging = false;
        pointerId = null;
        el.classList.remove('is-dragging');

        try {
            source.releasePointerCapture(event.pointerId);
        } catch {
            /* ignore */
        }

        if (storageKey) {
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    x: Number.parseFloat(el.style.left),
                    y: Number.parseFloat(el.style.top),
                }),
            );
        }
    };

    /**
     * --------------------------------------------
     * -----  `onPointerDown(event)`  -----
     * --------------------------------------------
     * - Inicia el arrastre cuando el usuario pulsa sobre una zona válida.
     */
    const onPointerDown = (event: PointerEvent): void => {
        if (event.button !== 0) {
            return;
        }

        const target = event.target as HTMLElement | null;
        if (target?.closest('button, a, input, select, textarea')) {
            return;
        }

        const rect = el.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        dragging = true;
        pointerId = event.pointerId;

        // Asegura capa flotante antes de mover
        placeFixed(el, rect.left, rect.top);
        el.classList.add('is-dragging');
        source.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const listenerOpts: AddEventListenerOptions = { signal: local.signal };

    source.addEventListener('pointerdown', onPointerDown, listenerOpts);
    source.addEventListener('pointermove', onPointerMove, listenerOpts);
    source.addEventListener('pointerup', stopDrag, listenerOpts);
    source.addEventListener('pointercancel', stopDrag, listenerOpts);

    return cleanup;
};
