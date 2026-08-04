# MyDailyTaskHistory — Gestor de tareas y tiempo

Dashboard administrativo para gestionar tareas con subtareas y saber cuánto
tiempo inviertes en cada una. Cada registro lleva **hora de inicio, hora final
y actividad**, y la aplicación calcula el tiempo por día, semana, mes o año.

```
Informática (tarea)
├── Udemy (subtarea)         → 18:00 – 20:30
└── Devtalles (subtarea)
Extracolor noche (tarea)     → 22:00 – 01:30  (turno de noche)
Otras Tareas (tarea)
└── Gasolinera (subtarea)
```

## Qué se puede hacer

- **Altas**: crear una tarea indicando sus subtareas en el mismo formulario, y
  añadir más subtareas después.
- **Bajas**: dar de baja tareas o subtareas conservando su histórico de tiempo
  (se pueden volver a dar de alta).
- **Modificar**: título, descripción y color de la tarea; título de la subtarea;
  fecha, horas y actividad de cada registro de tiempo.
- **Eliminar**: borrado definitivo de tareas, subtareas o registros.
- **Registrar tiempo** (en el Dashboard): hora de inicio y hora final en un día
  concreto, sobre una subtarea o directamente sobre la tarea, con una
  **actividad** obligatoria que describe qué se hizo. Los tramos que cruzan
  medianoche (22:00 → 01:30) se calculan correctamente.
- **Consultar**: contadores de hoy/semana/mes, calendario con el tiempo de cada
  día e informes por periodo con exportación a CSV.
- **Tema claro / oscuro**: interruptor en la cabecera; la preferencia se guarda
  en el navegador (si no hay, se usa la del sistema).

## Stack

- **Frontend**: [Astro](https://astro.build/) + TypeScript (CSS scoped, temas
  claro/oscuro, interactividad con scripts vanilla)
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

| Servicio | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:4321            |
| API      | http://localhost:3001            |
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

| Servicio              | URL                              |
| --------------------- | -------------------------------- |
| App (frontend + API)  | **http://localhost:3001**        |
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

## Secciones de la aplicación

| Sección   | Ruta        | Contenido                                                                 |
| --------- | ----------- | ------------------------------------------------------------------------- |
| Dashboard | `/`         | Tiempo de hoy/semana/mes, calendario y registros del día (alta/edición)   |
| Tareas    | `/tareas`   | Altas, bajas, modificaciones y eliminación de tareas y subtareas          |
| Informes  | `/informes` | Totales por tarea y subtarea del periodo, reparto por día y export a CSV  |

## Estructura

```
my-daily-task-history/
├── client/                 # Astro (dev :4321; en producción lo sirve Express)
│   ├── astro.config.mjs    # Proxy /api → localhost:3001 (solo en dev)
│   └── src/
│       ├── components/     # Sidebar, SummaryCards, Calendar, DayLog,
│       │                   # TaskManager, ReportPanel, Logo
│       ├── layouts/        # Layout: shell, tema claro/oscuro y estilos globales
│       ├── lib/            # api.ts, events.ts, time.ts, dom.ts, theme.ts
│       ├── pages/          # index (dashboard), tareas, informes
│       └── types/
└── server/                 # Express (:3001) — API; tras build también sirve el frontend
    ├── data/tasks.json     # Persistencia (formato v2; en .gitignore)
    ├── dist/index.js       # Entrypoint de producción (tras `pnpm build`)
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/       # tasks, entries, reports
        ├── storage/
        ├── types/
        └── utils/          # time, entries, colors
```

## Modelo de datos

```ts
interface TimeEntry {
    id: string;
    date: string; // "YYYY-MM-DD"
    start: string; // "HH:MM"
    end: string; // "HH:MM"
    minutes: number; // lo calcula el servidor
    note: string; // actividad realizada (obligatoria)
    createdAt: string;
    updatedAt: string;
}

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    active: boolean; // false = dada de baja
    entries: TimeEntry[];
    createdAt: string;
    updatedAt: string;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    color: string;
    completed: boolean;
    active: boolean; // false = dada de baja
    subtasks: Subtask[];
    entries: TimeEntry[]; // tiempo imputado directamente a la tarea
    createdAt: string;
    updatedAt: string;
}
```

El archivo de datos usa el formato `{ "version": 2, "tasks": [...] }`. Si
encuentra el formato antiguo (lista plana de tareas con `date`), lo migra al
arrancar y guarda una copia en `server/data/tasks.v1.backup.json`.

## API REST

| Método | Endpoint                                          | Descripción                                        |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/health`                                     | Estado del servidor                                |
| GET    | `/api/tasks?includeInactive=false`                | Listar tareas con subtareas y registros            |
| GET    | `/api/tasks/:id`                                  | Obtener una tarea                                  |
| POST   | `/api/tasks`                                      | Alta `{ title, description?, color?, subtasks? }`  |
| PUT    | `/api/tasks/:id`                                  | Modificar (incluye `active` para baja/alta)        |
| DELETE | `/api/tasks/:id`                                  | Eliminar tarea con su histórico                    |
| POST   | `/api/tasks/:taskId/subtasks`                     | Añadir subtarea `{ title }`                        |
| PUT    | `/api/tasks/:taskId/subtasks/:subtaskId`          | Modificar subtarea                                 |
| DELETE | `/api/tasks/:taskId/subtasks/:subtaskId`          | Eliminar subtarea                                  |
| GET    | `/api/entries?date=&from=&to=&taskId=&subtaskId=` | Listar registros de tiempo                         |
| POST   | `/api/entries`                                    | Crear `{ taskId, subtaskId?, date, start, end, note }` |
| PUT    | `/api/entries/:id`                                | Modificar `{ date?, start?, end?, note? }`         |
| DELETE | `/api/entries/:id`                                | Eliminar registro                                  |
| GET    | `/api/reports/summary?month=YYYY-MM`              | Totales por tarea y subtarea (o `?from=&to=`)      |
| GET    | `/api/reports/days?month=YYYY-MM`                 | Minutos por día (o `?from=&to=`)                   |
| GET    | `/api/reports/stats?date=YYYY-MM-DD`              | Contadores de hoy, semana y mes                    |

### Validaciones

- El `title` de tarea es **único entre las tareas activas**: al crear o
  renombrar con un título ya usado (sin distinguir mayúsculas ni espacios
  extra) la API responde `400` con `Ya existe una tarea activa con el título "…"`.
  Las tareas dadas de baja no bloquean el título.
- En los registros de tiempo, `note` es la **actividad** realizada y es
  **obligatoria** al crear o modificar: vacía responde `400` con
  `La actividad es obligatoria: describe qué hiciste en ese tiempo`.

## Despliegue en VPS (Nginx + PM2)

Este proyecto **no usa adaptador de Astro** (`@astrojs/node`). Astro se compila
a estático (`client/dist`) y **Express** sirve el frontend + la API en un solo
proceso Node.

Producción actual de referencia:

| Concepto | Valor |
| -------- | ----- |
| Dominio | `https://my-daily-task-history.antonydev.es` |
| Código en el VPS | `/var/www/my-daily-task-history` |
| Puerto Node | `3010` (el `3001` puede estar ocupado por otra app) |
| Entrypoint PM2 | `server/dist/index.js` |
| Datos | `server/data/tasks.json` (no va al repo; está en `.gitignore`) |

> No confundir con `/var/www/my-daily-task-history.antonydev.es` (carpeta vacía
> creada por el panel de Hostinger). La app vive en
> `/var/www/my-daily-task-history`.

### Arquitectura

```text
Navegador → Nginx (:80/:443) → proxy → Express (:3010)
                                      ├─ /api/*     → API REST
                                      └─ resto      → client/dist (Astro estático)
```

### Primera vez en el VPS

```bash
cd /var/www
git clone https://github.com/AntoniCut/my-daily-task-history.git my-daily-task-history
cd my-daily-task-history

# Node 18+ (recomendado 20+) y pnpm
pnpm install --frozen-lockfile
pnpm build

# Comprueba el entrypoint
ls server/dist/index.js
ls client/dist/index.html

# Prueba manual (Ctrl+C al terminar)
PORT=3010 node server/dist/index.js
# en otra sesión:
curl http://127.0.0.1:3010/api/health   # {"status":"ok"}
curl -I http://127.0.0.1:3010/          # 200 OK
```

Arranque permanente con PM2:

```bash
cd /var/www/my-daily-task-history
PORT=3010 pm2 start server/dist/index.js --name my-daily-task-history
pm2 save
pm2 startup   # ejecuta el comando que imprima
```

### Nginx

Un solo `server_name` activo (quita el site estático de Hostinger si existe):

```bash
sudo rm -f /etc/nginx/sites-enabled/my-daily-task-history.antonydev.es
sudo nano /etc/nginx/sites-available/my-daily-task-history
```

```nginx
server {
    listen 80;
    server_name my-daily-task-history.antonydev.es;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/my-daily-task-history /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl http://my-daily-task-history.antonydev.es/api/health
```

HTTPS:

```bash
sudo certbot --nginx -d my-daily-task-history.antonydev.es
```

### Actualizar (flujo habitual)

**En local**

```bash
git add .
git commit -m "mensaje"
git push origin master
```

**En el VPS**

```bash
cd /var/www/my-daily-task-history
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart my-daily-task-history
```

`git pull` solo trae código: hace falta **build + restart** para aplicar cambios.

Si cambias el entrypoint de PM2 (por ejemplo de `dist/src/index.js` a
`dist/index.js`), recrea el proceso:

```bash
pm2 delete my-daily-task-history 2>/dev/null
PORT=3010 pm2 start server/dist/index.js --name my-daily-task-history
pm2 save
```

### Datos de producción

- `server/data/*.json` está en `.gitignore`: no se sube al repo.
- Tras el primer deploy, las tareas viven solo en el VPS
  (`/var/www/my-daily-task-history/server/data/tasks.json`).
- Haz backup periódico de ese archivo.
- Si un `git pull` antiguo se queja de cambios locales en `tasks.json`
  (cuando aún estaba trackeado):

```bash
cp server/data/tasks.json /root/tasks.prod.json
git checkout -- server/data/tasks.json
git pull
cp /root/tasks.prod.json server/data/tasks.json
pnpm build
pm2 restart my-daily-task-history
```

### Comprobaciones rápidas

```bash
pm2 status
pm2 logs my-daily-task-history --lines 50
curl http://127.0.0.1:3010/api/health
curl -I http://127.0.0.1:3010/
curl http://my-daily-task-history.antonydev.es/api/health
```

En el arranque, los logs de PM2 deben mostrar la ruta del frontend, por ejemplo:

```text
Frontend estático: /var/www/my-daily-task-history/client/dist
```

### Diferencias con un Astro SSR (`@astrojs/node`)

| | Este proyecto | Astro SSR (p. ej. `astro-http`) |
|--|--|--|
| Adaptador | No | `@astrojs/node` |
| Build | `pnpm build` | `pnpm run build:node` |
| PM2 arranca | `server/dist/index.js` (Express) | `dist/server/entry.mjs` (Astro) |
| Quién sirve HTML | Express (`client/dist`) | Astro Node |

## Licencia

Uso personal.
