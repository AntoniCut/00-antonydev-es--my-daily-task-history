/*
 *  ----------------------------------------------------  *
 *  -----  colors.ts  --  /client/src/lib/colors.ts  -----  *
 *  ----------------------------------------------------  *
 */

/** Paleta asignada a las tareas para identificarlas en la interfaz. */
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

export const nextColor = (usedCount: number): string =>
    TASK_COLORS[usedCount % TASK_COLORS.length];

export const resolveSubtaskColor = (
    subtask: { color?: string },
    task: { color: string },
): string =>
    subtask.color && /^#[0-9a-fA-F]{6}$/.test(subtask.color)
        ? subtask.color
        : task.color;
