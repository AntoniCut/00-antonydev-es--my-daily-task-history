/*
	*  --------------------------------------------------------  *
	*  -----  colors.ts  --  /server/src/utils/colors.ts  -----  *
	*  --------------------------------------------------------  *
*/

/** Paleta asignada a las tareas para identificarlas en las gráficas. */
export const TASK_COLORS = [
  '#5b8def',
  '#4fbf8b',
  '#e5a34d',
  '#b57bec',
  '#e5626c',
  '#3fb6c4',
  '#d97ea6',
  '#8ab84f',
] as const satisfies readonly string[];

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_REGEX.test(value);

export const nextColor = (usedCount: number): string =>
  TASK_COLORS[usedCount % TASK_COLORS.length];
