# My Daily Task History  -  Mi Diario de Tareas

Diario personal de actividades diarias. Selecciona un día en el calendario y crea, lista, edita o elimina las tareas de esa fecha.

## Stack

- **Frontend**: [Astro](https://astro.build/) + TypeScript (CSS scoped, interactividad con scripts vanilla)
- **Backend**: Node.js + Express + TypeScript (API REST)
- **Persistencia**: archivo JSON (`server/data/tasks.json`)
- **Monorepo**: npm workspaces (`client` + `server`)

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

## Instalación

```bash
npm install
```

## Uso

### Desarrollo (`npm run dev`)

Arranca frontend y API por separado:

```bash
npm run dev
```

| Servicio | URL                           |
| -------- | ----------------------------- |
| Frontend | http://localhost:4321         |
| API      | http://localhost:3001         |
| Health   | http://localhost:3001/api/health |

En este modo Astro usa un **proxy de Vite**: las llamadas a `/api` en `:4321` se reenvían a Express en `:3001`.

### Producción local (`build` + `preview`)

Tras compilar, **frontend y API viven en el mismo origen**: Express sirve `client/dist` y la API.

```bash
npm run build
npm run preview   # o npm run start
```

| Servicio              | URL                           |
| --------------------- | ----------------------------- |
| App (frontend + API)  | **http://localhost:3001**     |
| Health                | http://localhost:3001/api/health |

Importante:

- Tras `build` + `preview` / `start`, abre **http://localhost:3001**, no el puerto 4321.
- El script `preview` del proyecto arranca Express (no `astro preview`).
- `astro preview` solo sirve el HTML estático y **no incluye la API** → las llamadas a `/api` dan 404.

### Scripts

```bash
npm run dev          # desarrollo: client :4321 + server :3001 (proxy /api)
npm run dev:server   # solo la API
npm run dev:client   # solo el frontend
npm run build        # compila server (tsc) y client (astro build)
npm run preview      # producción local: frontend + API en :3001
npm run start        # igual que preview
```

### Formato (cliente)

```bash
npm run format -w client
npm run format:check -w client
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
