# PLAN — my-daily-task-history

Dashboard administrativo para gestionar tareas con subtareas y controlar el
tiempo invertido en cada una. Cada subtarea acumula **registros de tiempo**
(hora de inicio y hora final de un día concreto), y con ellos se calcula el
tiempo dedicado por día, semana, mes o año.

## Stack

- **Frontend**: Astro + TypeScript. CSS con *scoped styles* en cada componente y
  unas pocas utilidades globales en `Layout.astro`. Sin frameworks UI: la
  interactividad se hace con TypeScript vanilla en los `<script>` de los
  componentes Astro.
- **Backend**: Node.js + Express + TypeScript (API REST).
- **Persistencia**: archivo JSON plano (`server/data/tasks.json`).

## Estructura del proyecto

Monorepo con pnpm workspaces (declarados en `pnpm-workspace.yaml`):

```
my-daily-task-history/
├── PLAN.md
├── package.json              # Workspaces + scripts raíz (concurrently)
├── client/                   # Astro (puerto 4321)
│   ├── astro.config.mjs      # Proxy /api → http://localhost:3001
│   └── src/
│       ├── layouts/Layout.astro   # Shell del dashboard + estilos globales
│       ├── pages/
│       │   ├── index.astro        # Dashboard (contadores, calendario, día)
│       │   ├── tareas.astro       # Gestor de tareas y subtareas
│       │   └── informes.astro     # Informes por periodo
│       ├── components/
│       │   ├── Logo.astro
│       │   ├── Sidebar.astro       # Navegación lateral
│       │   ├── SummaryCards.astro  # Hoy / semana / mes / activas
│       │   ├── Calendar.astro      # Calendario con el tiempo de cada día
│       │   ├── DayLog.astro        # Registros del día + alta rápida
│       │   ├── TaskManager.astro   # CRUD de tareas y subtareas
│       │   └── ReportPanel.astro   # Totales por tarea/subtarea + CSV
│       ├── lib/
│       │   ├── api.ts             # Cliente fetch hacia la API
│       │   ├── events.ts          # Eventos custom entre componentes
│       │   ├── time.ts            # Fechas, rangos y formato de duraciones
│       │   └── dom.ts             # Init por página y helpers de DOM
│       └── types/task.ts
└── server/                   # Express (puerto 3001)
    ├── data/tasks.json       # Almacenamiento (formato v2)
    └── src/
        ├── index.ts          # Arranque
        ├── app.ts            # Express + CORS + JSON + routers
        ├── types/task.ts
        ├── storage/jsonStorage.ts     # Lectura/escritura + migración v1 → v2
        ├── utils/
        │   ├── time.ts       # Validación de fechas/horas y rangos
        │   ├── entries.ts    # Recorrido del árbol de registros
        │   └── colors.ts     # Paleta de colores de las tareas
        ├── services/
        │   ├── tasks.service.ts    # Tareas y subtareas
        │   ├── entries.service.ts  # Registros de tiempo
        │   └── reports.service.ts  # Agregados y contadores
        ├── controllers/
        │   ├── tasks.controller.ts
        │   ├── entries.controller.ts
        │   └── reports.controller.ts
        └── routes/
            ├── tasks.routes.ts
            ├── entries.routes.ts
            └── reports.routes.ts
```

## Modelo de datos

Jerarquía **tarea → subtarea → registro de tiempo**. Una tarea también puede
acumular registros propios (útil cuando no tiene subtareas, por ejemplo
"Extracolor noche").

```ts
interface TimeEntry {
  id: string;
  date: string;      // "YYYY-MM-DD"
  start: string;     // "HH:MM"
  end: string;       // "HH:MM"
  minutes: number;   // calculado en el servidor
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;      // false = dada de baja
  entries: TimeEntry[];
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  color: string;        // hex, para las gráficas
  completed: boolean;
  active: boolean;      // false = dada de baja
  subtasks: Subtask[];
  entries: TimeEntry[]; // tiempo imputado directamente a la tarea
  createdAt: string;
  updatedAt: string;
}
```

Ejemplo del árbol que se gestiona:

```
Informática (tarea)
├── Udemy (subtarea)      → registros 18:00–20:30, ...
└── Devtalles (subtarea)
Extracolor noche (tarea)  → registros 22:00–01:30 (cruza medianoche)
Otras Tareas (tarea)
└── Gasolinera (subtarea)
```

Detalles del cálculo de tiempo:

- Si `end` es anterior o igual a `start`, el tramo **cruza la medianoche** y se
  suman 24 h (turnos de noche). `end === start` se rechaza como error.
- `minutes` lo calcula siempre el servidor: el cliente nunca lo envía.
- Baja lógica (`active: false`) frente a borrado: la baja conserva el histórico
  de tiempo; `DELETE` lo elimina definitivamente.

### Archivo de datos y migración

`server/data/tasks.json` usa el formato `{ "version": 2, "tasks": [...] }`. Al
arrancar, si encuentra el formato antiguo (v1: array plano de tareas con `date`
y sin subtareas), lo migra automáticamente: cada título distinto pasa a ser una
tarea y el archivo original se conserva como `data/tasks.v1.backup.json`. Las
fechas de v1 no se convierten en registros de tiempo porque no guardaban horas.

## API REST (puerto 3001)

| Método | Endpoint                                     | Descripción                                        |
| ------ | -------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/health`                                | Estado del servidor                                |
| GET    | `/api/tasks?includeInactive=false`           | Listar tareas con sus subtareas y registros        |
| GET    | `/api/tasks/:id`                             | Obtener una tarea                                  |
| POST   | `/api/tasks`                                 | Alta `{ title, description?, color?, subtasks? }`  |
| PUT    | `/api/tasks/:id`                             | Modificar (incluye `active` para baja/alta)        |
| DELETE | `/api/tasks/:id`                             | Eliminar tarea con todo su histórico               |
| POST   | `/api/tasks/:taskId/subtasks`                | Añadir subtarea `{ title }`                        |
| PUT    | `/api/tasks/:taskId/subtasks/:subtaskId`     | Modificar subtarea (`title`, `completed`, `active`)|
| DELETE | `/api/tasks/:taskId/subtasks/:subtaskId`     | Eliminar subtarea                                  |
| GET    | `/api/entries?date=&from=&to=&taskId=&subtaskId=` | Listar registros de tiempo                    |
| POST   | `/api/entries`                               | Crear `{ taskId, subtaskId?, date, start, end, note? }` |
| PUT    | `/api/entries/:id`                           | Modificar `{ date?, start?, end?, note? }`         |
| DELETE | `/api/entries/:id`                           | Eliminar registro                                  |
| GET    | `/api/reports/summary?from=&to=` o `?month=` | Totales por tarea y subtarea del periodo           |
| GET    | `/api/reports/days?from=&to=` o `?month=`    | Minutos por día (indicadores del calendario)       |
| GET    | `/api/reports/stats?date=`                   | Contadores de hoy, semana y mes                    |

Las validaciones devuelven `400` con `{ error }`; lo inexistente, `404`.

## Funcionamiento de la UI

Tres secciones accesibles desde la barra lateral:

1. **Dashboard** (`/`): tarjetas con el tiempo de hoy, la semana y el mes;
   calendario mensual que muestra el tiempo registrado en cada día; y el panel
   del día seleccionado, donde se dan de alta registros (tarea, subtarea, hora
   de inicio, hora final y nota) y se editan o eliminan los existentes.
2. **Tareas** (`/tareas`): alta de tareas indicando sus subtareas en el mismo
   formulario, y árbol con todas las tareas. Cada fila permite añadir subtarea,
   registrar tiempo, modificar, dar de baja o de alta y eliminar. Los totales
   se muestran como distintivos (total histórico y del mes en curso).
3. **Informes** (`/informes`): selector de periodo (esta semana, semana
   anterior, este mes, mes anterior, este año o rango personalizado) con el
   reparto por tarea y subtarea, el reparto por día y exportación a CSV.

Comunicación entre componentes mediante eventos en `document`:
`app:date-selected` (día elegido en el calendario) y `app:data-changed` (tras
cualquier alta, baja, modificación o borrado), que refresca contadores,
calendario, listados e informes.

Como el layout usa `<ClientRouter />`, cada componente se inicializa en
`astro:page-load` a través de `onPageReady()` (`lib/dom.ts`), que además cancela
los listeners de la página anterior con un `AbortSignal`.

## Comandos

Gestión de dependencias con **pnpm** (workspaces declarados en
`pnpm-workspace.yaml`).

```bash
pnpm install        # Instala dependencias de todos los workspaces
pnpm dev            # Arranca server (3001) y client (4321) a la vez
pnpm dev:server     # Solo la API
pnpm dev:client     # Solo el frontend
pnpm build          # Compila server (tsc) y client (astro build)
pnpm start          # Arranca el servidor compilado (producción)
```

## Futuras mejoras (pendientes)

- Cronómetro en marcha (empezar/parar) además del alta manual de horas.
- Detección de solapes entre registros del mismo día.
- Objetivos de horas por tarea y aviso al superarlos.
- Migrar la persistencia a SQLite si crece el volumen de datos.
