# PLAN — my-daily-task-history

Diario personal de actividades diarias con tareas. Permite seleccionar un día en un
calendario y crear, listar, modificar y eliminar las tareas de ese día.

## Stack

- **Frontend**: Astro + TypeScript. CSS con *scoped styles* en cada componente.
  Sin frameworks UI: la interactividad se hace con TypeScript vanilla en los
  `<script>` de los componentes Astro.
- **Backend**: Node.js + Express + TypeScript (API REST).
- **Persistencia**: archivo JSON plano (`server/data/tasks.json`).

## Estructura del proyecto

Monorepo con npm workspaces:

```
my-daily-task-history/
├── PLAN.md
├── package.json              # Workspaces + scripts raíz (concurrently)
├── client/                   # Astro (puerto 4321)
│   ├── astro.config.mjs      # Proxy /api → http://localhost:3001
│   └── src/
│       ├── layouts/Layout.astro
│       ├── pages/index.astro
│       ├── components/
│       │   ├── Calendar.astro    # Calendario mensual propio
│       │   ├── TaskForm.astro    # Crear / editar tarea
│       │   ├── TaskList.astro    # Lista de tareas del día
│       │   └── TaskItem.astro    # Plantilla de tarea individual
│       ├── lib/
│       │   ├── api.ts            # Cliente fetch hacia la API
│       │   └── events.ts         # Eventos custom entre componentes
│       └── types/task.ts
└── server/                   # Express (puerto 3001)
    ├── data/tasks.json       # Almacenamiento
    └── src/
        ├── index.ts          # Arranque
        ├── app.ts            # Express + CORS + JSON
        ├── types/task.ts
        ├── storage/jsonStorage.ts
        ├── services/tasks.service.ts
        ├── controllers/tasks.controller.ts
        └── routes/tasks.routes.ts
```

## Modelo de datos

```ts
interface Task {
  id: string;          // crypto.randomUUID()
  title: string;
  description?: string;
  date: string;        // "YYYY-MM-DD"
  completed: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

## API REST (puerto 3001)

| Método | Endpoint                        | Descripción                                  |
| ------ | ------------------------------- | -------------------------------------------- |
| GET    | `/api/health`                   | Estado del servidor                          |
| GET    | `/api/tasks?date=YYYY-MM-DD`    | Listar tareas (filtro opcional por fecha)    |
| GET    | `/api/tasks/dates?month=YYYY-MM`| Fechas con tareas (indicadores del calendario)|
| GET    | `/api/tasks/:id`                | Obtener una tarea                            |
| POST   | `/api/tasks`                    | Crear tarea `{ title, description?, date }`  |
| PUT    | `/api/tasks/:id`                | Modificar tarea (parcial)                    |
| DELETE | `/api/tasks/:id`                | Eliminar tarea                               |

## Funcionamiento de la UI

1. `index.astro` muestra el **Calendar** (mes actual, navegación anterior/siguiente,
   punto verde en los días que tienen tareas) y selecciona el día actual al cargar.
2. Al hacer clic en un día se emite `app:date-selected` y **TaskList** carga las
   tareas de esa fecha desde la API.
3. **TaskForm** crea tareas para el día seleccionado. Al pulsar ✏️ en una tarea,
   el formulario pasa a modo edición (evento `app:edit-task`).
4. Cada tarea permite: marcarla como completada (checkbox), editarla y eliminarla.
5. Tras cualquier cambio se emite `app:tasks-changed` y se refrescan la lista y
   los indicadores del calendario.

## Comandos

```bash
npm install        # Instala dependencias de todos los workspaces
npm run dev        # Arranca server (3001) y client (4321) a la vez
npm run dev:server # Solo la API
npm run dev:client # Solo el frontend
npm run build      # Compila server (tsc) y client (astro build)
```

## Futuras mejoras (pendientes)

- Filtros por estado (completadas / pendientes).
- Búsqueda de tareas.
- Migrar la persistencia a SQLite si crece el volumen de datos.
