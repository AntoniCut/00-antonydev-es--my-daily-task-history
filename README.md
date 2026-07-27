# My Daily Task History  -  Mi Diario de Tareas

Diario personal de actividades diarias. Selecciona un día en el calendario y crea, lista, edita o elimina las tareas de esa fecha.

## Stack

- **Frontend**: [Astro](https://astro.build/) + TypeScript (CSS scoped, interactividad con scripts vanilla)
- **Backend**: Node.js + Express + TypeScript (API REST)
- **Persistencia**: archivo JSON (`server/data/tasks.json`)
- **Monorepo**: pnpm workspaces (`client` + `server`)

## Requisitos

- Node.js 18+ (recomendado 20+)
- pnpm 9+

## Instalación

```bash
pnpm install
```

## Uso

### Desarrollo (`pnpm dev`)

Arranca frontend y API por separado:

```bash
pnpm dev
```

| Servicio | URL                           |
| -------- | ----------------------------- |
| Frontend | http://localhost:4321         |
| API      | http://localhost:3001         |
| Health   | http://localhost:3001/api/health |

En este modo Astro usa un **proxy de Vite**: las llamadas a `/api` en `:4321` se reenvían a Express en `:3001`.

### Producción local (`build` + `preview`)

> **Un único comando compila todo.** `pnpm build` ejecuta en orden ambos builds:
> 1. **Servidor** → `pnpm --filter server run build` (`tsc` → `server/dist/`)
> 2. **Cliente** → `pnpm --filter client run build` (`astro check && astro build` → `client/dist/`)
>
> No hace falta compilar cada workspace por separado.

Tras compilar, **frontend y API viven en el mismo origen**: Express sirve `client/dist` y la API.

```bash
pnpm build       # compila servidor (tsc) y cliente (astro build), en este orden
pnpm preview     # o pnpm start → arranca Express en :3001 (frontend + API)
```

| Servicio              | URL                           |
| --------------------- | ----------------------------- |
| App (frontend + API)  | **http://localhost:3001**     |
| Health                | http://localhost:3001/api/health |

Importante:

- Tras `build` + `preview` / `start`, abre **http://localhost:3001**, no el puerto 4321.
- El script `preview` del proyecto arranca Express (no `astro preview`).
- `astro preview` solo sirve el HTML estático y **no incluye la API** → las llamadas a `/api` dan 404.
- Para compilar **solo uno** de los dos (en caso de que lo necesites):
  ```bash
  pnpm --filter server run build   # solo el API
  pnpm --filter client run build   # solo el frontend
  ```

### Scripts

```bash
pnpm dev          # desarrollo: client :4321 + server :3001 (proxy /api)
pnpm dev:server   # solo la API
pnpm dev:client   # solo el frontend
pnpm build        # compila TODO: server (tsc) y client (astro build) en un solo comando
pnpm preview      # producción local: frontend + API en :3001
pnpm start        # igual que preview
```

### Formato (cliente)

```bash
pnpm --filter client run format
pnpm --filter client run format:check
```

## Estructura

```
my-daily-task-history/
├── client/                 # Astro (dev :4321; en producción lo sirve Express)
│   ├── astro.config.mjs    # Proxy /api → localhost:3001 (solo en dev)
│   └── src/
│       ├── components/     # Calendar, TaskForm, TaskList, TaskItem, Logo
│       ├── layouts/
│       ├── lib/            # api.ts, events.ts
│       ├── pages/
│       └── types/
└── server/                 # Express (:3001) — API; tras build también sirve el frontend
    ├── data/tasks.json     # Persistencia
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/
        ├── storage/
        └── types/
```

## Modelo de datos

```ts
interface Task {
  id: string;           // UUID
  title: string;
  description?: string;
  date: string;         // "YYYY-MM-DD"
  completed: boolean;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

## API REST

| Método | Endpoint                         | Descripción                                   |
| ------ | -------------------------------- | --------------------------------------------- |
| GET    | `/api/health`                    | Estado del servidor                           |
| GET    | `/api/tasks?date=YYYY-MM-DD`     | Listar tareas (filtro opcional por fecha)     |
| GET    | `/api/tasks/dates?month=YYYY-MM` | Fechas con tareas (indicadores del calendario)|
| GET    | `/api/tasks/:id`                 | Obtener una tarea                             |
| POST   | `/api/tasks`                     | Crear tarea `{ title, description?, date }`   |
| PUT    | `/api/tasks/:id`                 | Modificar tarea (parcial)                     |
| DELETE | `/api/tasks/:id`                 | Eliminar tarea                                |

## Cómo funciona la UI

1. El calendario muestra el mes actual; los días con tareas tienen un indicador.
2. Al seleccionar un día se cargan sus tareas desde la API.
3. El formulario crea tareas para el día activo, o edita una existente.
4. Cada tarea se puede completar, editar o eliminar.
5. Tras un cambio se refrescan la lista y los indicadores del calendario.

## Licencia

Uso personal.
