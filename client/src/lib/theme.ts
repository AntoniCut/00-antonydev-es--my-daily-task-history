/*
 *  ----------------------------------------------------  *
 *  -----  theme.ts  --  /client/src/lib/theme.ts  -----  *
 *  ----------------------------------------------------  *
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

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
