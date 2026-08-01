/*
    *  --------------------------------------------------------------------  *
    *  -----  theme.ts  --  /client/src/lib/theme.ts  -----  *
    *  --------------------------------------------------------------------  *
*/

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/**
 * ------------------------------------------
 * -----  `faviconForTheme(theme)`  -----
 * ------------------------------------------
 * - Resuelve el favicon que corresponde al tema activo.
 */
export const faviconForTheme = (theme: Theme): string =>
    theme === 'dark' ? '/favicon-light.svg' : '/favicon-dark.svg';

/**
 * --------------------------------------
 * -----  `syncFavicon(theme)`  -----
 * --------------------------------------
 * - Sincroniza el favicon del documento con el tema recibido.
 */
const syncFavicon = (theme: Theme): void => {
    const href = faviconForTheme(theme);
    const existing =
        document.querySelector<HTMLLinkElement>('link#app-favicon') ??
        document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (existing) {
        existing.href = href;
        return;
    }

    const link = document.createElement('link');
    link.id = 'app-favicon';
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;
    document.head.appendChild(link);
};

/**
 * ------------------------------------
 * -----  `resolveTheme()`  -----
 * ------------------------------------
 * - Resuelve el tema guardado o, si no existe, usa la preferencia del sistema.
 */
export const resolveTheme = (): Theme => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
};

/**
 * ----------------------------------
 * -----  `applyTheme(theme)`  -----
 * ----------------------------------
 * - Aplica el tema al documento y actualiza el favicon.
 */
export const applyTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    syncFavicon(theme);
};

/**
 * --------------------------------
 * -----  `setTheme(theme)`  -----
 * --------------------------------
 * - Guarda el tema elegido y lo aplica de inmediato.
 */
export const setTheme = (theme: Theme): void => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
};

/**
 * ----------------------------------
 * -----  `toggleTheme()`  -----
 * ----------------------------------
 * - Alterna entre modo claro y oscuro devolviendo el nuevo tema.
 */
export const toggleTheme = (): Theme => {
    const next: Theme = resolveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
};
