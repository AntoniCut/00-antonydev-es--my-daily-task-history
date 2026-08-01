/*
    *  ------------------------------------------------  *
    *  -----  index.ts  --  /server/src/index.ts  -----  *
    *  ------------------------------------------------  *
*/
import { createApp } from './app.js';

const PORT = process.env.PORT ?? 3001;

const app = createApp();

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Inicia el servidor HTTP y muestra las URLs disponibles.
 */
app.listen(PORT, (): void => {
    console.log(`Diario de tareas en http://localhost:${PORT}`);
    console.log(`API health: http://localhost:${PORT}/api/health`);
});
