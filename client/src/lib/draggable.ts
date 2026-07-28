/*
 *  ----------------------------------------------------------  *
 *  -----  draggable.ts  --  /client/src/lib/draggable.ts  -----  *
 *  ----------------------------------------------------------  *
 */

/**
 * Arrastre libre de un elemento flotante (`position: fixed`).
 *
 * No usa el fantasma nativo de HTML DnD: mueve el propio nodo con
 * pointer events, así no deja rastro ni desplaza el resto del layout.
 */

export interface DraggableOptions {
    /** Solo se inicia el drag desde este selector (p. ej. un asa). */
    handle?: string;
    /** Clave de localStorage para recordar la posición. */
    storageKey?: string;
    /** Señal para limpiar listeners al cambiar de página. */
    signal?: AbortSignal;
}

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

const readSaved = (key: string): { x: number; y: number } | null => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return { x: parsed.x, y: parsed.y };
        }
    } catch {
        /* ignore */
    }
    return null;
};

/** Coloca `el` en coordenadas de viewport sin afectar el flujo del documento. */
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
 * Ancla el panel flotante a la posición de un hueco del layout (p. ej. sidebar).
 * Si hay posición guardada, la restaura.
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
 * Hace arrastrable un elemento que ya es (o pasará a ser) `position: fixed`.
 */
export const makeDraggable = (
    el: HTMLElement,
    options: DraggableOptions = {},
): void => {
    const { handle, storageKey, signal } = options;
    const listenerOpts: AddEventListenerOptions | undefined = signal
        ? { signal }
        : undefined;

    const source = handle
        ? el.querySelector<HTMLElement>(handle)
        : el;

    if (!source) {
        console.warn('[draggable] No se encontró el asa:', handle);
        return;
    }

    el.classList.add('is-draggable');
    source.style.touchAction = 'none';

    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let pointerId: number | null = null;

    const onPointerMove = (event: PointerEvent): void => {
        if (!dragging || event.pointerId !== pointerId) return;
        placeFixed(el, event.clientX - offsetX, event.clientY - offsetY);
    };

    const stopDrag = (event: PointerEvent): void => {
        if (!dragging || event.pointerId !== pointerId) return;
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

    source.addEventListener(
        'pointerdown',
        (event: PointerEvent) => {
            if (event.button !== 0) return;

            const target = event.target as HTMLElement | null;
            if (target?.closest('button, a, input, select, textarea')) return;

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
        },
        listenerOpts,
    );

    source.addEventListener('pointermove', onPointerMove, listenerOpts);
    source.addEventListener('pointerup', stopDrag, listenerOpts);
    source.addEventListener('pointercancel', stopDrag, listenerOpts);
};
