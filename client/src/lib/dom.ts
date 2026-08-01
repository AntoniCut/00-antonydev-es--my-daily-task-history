/*
    *  --------------------------------------------------------------------------  *
    *  -----  dom.ts  --  /client/src/lib/dom.ts  -----  *
    *  --------------------------------------------------------------------------  *
*/

export interface ConfirmOptions {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

interface CreateOptions {
    className?: string;
    text?: string;
    title?: string;
    attrs?: Record<string, string>;
}

/**
 * ----------------------------------------------------------------------------------------------------
 * -----  `onPageReady(init)`  -----
 * ----------------------------------------------------------------------------------------------------
 * - Inicializa un componente en cada carga de página vía astro:page-load.
 */
export const onPageReady = (init: (signal: AbortSignal) => void): void => {
    let controller: AbortController | null = null;

    document.addEventListener('astro:page-load', () => {
        controller?.abort();
        controller = new AbortController();
        init(controller.signal);
    });
};

/**
 * ----------------------------------------------------------------------------------------------
 * -----  `query(root, selector)`  -----
 * ----------------------------------------------------------------------------------------------
 * - Busca un elemento y falla de forma explícita si la plantilla ha cambiado.
 */
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

/**
 * ------------------------------------------------------------------------------------
 * -----  `create(tag, options)`  -----
 * ------------------------------------------------------------------------------------
 * - Crea un elemento del DOM con clases, texto y atributos opcionales.
 */
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

/**
 * --------------------------------------------------------------------------------------------------
 * -----  `showError(element, message)`  -----
 * --------------------------------------------------------------------------------------------------
 * - Muestra u oculta un mensaje de error en un elemento con role alert.
 */
export const showError = (
    element: HTMLElement,
    message: string | null,
): void => {
    element.textContent = message ?? '';
    element.hidden = !message;
};

/**
 * --------------------------------------------------------------------------------------------------
 * -----  `showConfirm(options)`  -----
 * --------------------------------------------------------------------------------------------------
 * - Muestra un diálogo de confirmación visual y devuelve la elección del usuario.
 */
export const showConfirm = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
        const dialog = create('dialog', {
            className: 'app-confirm',
            attrs: { 'aria-labelledby': 'app-confirm-title' },
        });

        const form = create('form', {
            className: 'app-confirm-form',
            attrs: { method: 'dialog' },
        });

        const title = create('h2', {
            className: 'app-confirm-title',
            text: options.title ?? 'Confirmar',
            attrs: { id: 'app-confirm-title' },
        });

        const message = create('p', {
            className: 'app-confirm-message',
            text: options.message,
        });

        const actions = create('div', { className: 'app-confirm-actions' });

        const cancelBtn = create('button', {
            className: 'btn-secondary',
            text: options.cancelText ?? 'Cancelar',
            attrs: { type: 'submit', value: 'cancel' },
        });

        const confirmBtn = create('button', {
            className: options.danger ? 'btn-danger' : 'btn-primary',
            text: options.confirmText ?? 'Confirmar',
            attrs: { type: 'submit', value: 'confirm' },
        });

        form.addEventListener('submit', (event: SubmitEvent) => {
            event.preventDefault();
            const submitter = event.submitter as HTMLButtonElement | null;
            dialog.close(submitter?.value === 'confirm' ? 'confirm' : 'cancel');
        });

        dialog.addEventListener('close', () => {
            const confirmed = dialog.returnValue === 'confirm';
            dialog.remove();
            resolve(confirmed);
        });

        dialog.addEventListener('cancel', (event: Event) => {
            event.preventDefault();
            dialog.close('cancel');
        });

        actions.append(cancelBtn, confirmBtn);
        form.append(title, message, actions);
        dialog.appendChild(form);
        document.body.appendChild(dialog);
        dialog.showModal();
        confirmBtn.focus();
    });
