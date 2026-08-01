/*
    *  --------------------------------------------------------------------  *
    *  -----  colors.ts  --  /client/src/lib/colors.ts  -----  *
    *  --------------------------------------------------------------------  *
*/

export const TASK_COLORS = [
    '#5b8def',
    '#4fbf8b',
    '#e5a34d',
    '#b57bec',
    '#e5626c',
    '#3fb6c4',
    '#d97ea6',
    '#8ab84f',
] as const;

/**
 * ----------------------------------------
 * -----  `nextColor(usedCount)`  -----
 * ----------------------------------------
 * - Devuelve el siguiente color disponible según la cantidad ya usada.
 */
export const nextColor = (usedCount: number): string =>
    TASK_COLORS[usedCount % TASK_COLORS.length];

/**
 * --------------------------------------------------------
 * -----  `resolveSubtaskColor(subtask, task)`  -----
 * --------------------------------------------------------
 * - Resuelve el color final de una subtarea priorizando su color válido.
 */
export const resolveSubtaskColor = (
    subtask: { color?: string },
    task: { color: string },
): string =>
    subtask.color && /^#[0-9a-fA-F]{6}$/.test(subtask.color)
        ? subtask.color
        : task.color;
