/*
 *  ------------------------------------------------  *
 *  -----  dom.ts  --  /client/src/lib/dom.ts  -----  *
 *  ------------------------------------------------  *
 */

/**
 * Inicializa un componente en cada carga de página.
 *
 * Con `<ClientRouter />` el navegador no vuelve a ejecutar los scripts de tipo
 * módulo al navegar, así que la inicialización se engancha a `astro:page-load`
 * (se dispara en la primera carga y en cada transición). El `AbortSignal` que
 * recibe `init` se cancela al entrar en la página siguiente: registrar los
 * listeners con `{ signal }` evita que queden apuntando a un DOM ya sustituido.
 */
export const onPageReady = (init: (signal: AbortSignal) => void): void => {
    let controller: AbortController | null = null;

    document.addEventListener('astro:page-load', () => {
        controller?.abort();
        controller = new AbortController();
        init(controller.signal);
    });
};

/** Busca un elemento y falla de forma explícita si la plantilla ha cambiado. */
export const query = <T extends Element>(
    root: ParentNode,
    selector: string,
): T => {
    const element = root.querySelector<T>(selector);
    if (!element) {
        throw new Error(`No se encontró el elemento "${selector}"`);
    }
    return element;
};

interface CreateOptions {
    className?: string;
    text?: string;
    title?: string;
    attrs?: Record<string, string>;
}

export const create = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    { className, text, title, attrs }: CreateOptions = {},
): HTMLElementTagNameMap[K] => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    if (title) element.title = title;
    for (const [name, value] of Object.entries(attrs ?? {})) {
        element.setAttribute(name, value);
    }
    return element;
};

/** Muestra u oculta un mensaje de error en un elemento con `role="alert"`. */
export const showError = (
    element: HTMLElement,
    message: string | null,
): void => {
    element.textContent = message ?? '';
    element.hidden = !message;
};
