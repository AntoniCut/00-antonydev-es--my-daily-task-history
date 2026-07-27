/*
	*  ------------------------------------------------  *
	*  -----  index.ts  --  /server/src/index.ts  -----  *
	*  ------------------------------------------------  *
*/
import { createApp } from './app.js';

const PORT = process.env.PORT ?? 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Diario de tareas en http://localhost:${PORT}`);
  console.log(`API health: http://localhost:${PORT}/api/health`);
});
