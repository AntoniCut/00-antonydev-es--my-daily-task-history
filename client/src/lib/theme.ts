/*
 *  ----------------------------------------------------  *
 *  -----  theme.ts  --  /client/src/lib/theme.ts  -----  *
 *  ----------------------------------------------------  *
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/** Favicon: modo oscuro → icono claro; modo claro → icono oscuro. */
export const faviconForTheme = (theme: Theme): string =>
    theme === 'dark' ? '/favicon-light.svg' : '/favicon-dark.svg';

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

/** Resuelve el tema guardado o, si no hay, el del sistema. */
export const resolveTheme = (): Theme => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
};

export const applyTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    syncFavicon(theme);
};

export const setTheme = (theme: Theme): void => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
};

export const toggleTheme = (): Theme => {
    const next: Theme = resolveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
};
