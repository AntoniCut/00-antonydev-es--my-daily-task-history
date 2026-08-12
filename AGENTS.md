# AGENTS.md — my-daily-task-history

## Proyecto

Monorepo pnpm (`pnpm-workspace.yaml`) con dos workspaces:

- **client/** — Astro + TypeScript. Sin frameworks UI: la interactividad es
  TypeScript vanilla en `<script>` de cada componente. CSS scoped + estilos
  globales en `layouts/Layout.astro` (temas claro/oscuro vía
  `[data-theme]`).
- **server/** — Node.js + Express + TypeScript (API REST). Persistencia en
  `server/data/tasks.json` (en `.gitignore`; no sube al repo).

## Comandos

```bash
pnpm dev                          # client :4321 + server :3001 (proxy /api)
pnpm dev:server                   # solo la API
pnpm dev:client                   # solo el frontend
pnpm build                        # server (tsc) + client (astro check && astro build)
pnpm preview / pnpm start         # Express sirve frontend + API en :3001
pnpm --filter server exec tsc --noEmit   # typecheck del server sin emitir
pnpm --filter client exec astro check    # typecheck del client
pnpm --filter client run format / format:check   # prettier
```

## Convenciones de código

- Aplicar siempre las skills del usuario:
  - **skill-typescript** — sin `var`, sin `alert/confirm/prompt`, sin
    `innerHTML`, HTML semántico, funciones flecha tipadas, `as` para
    referencias al DOM, evitar `any` (usar `unknown` + comprobación).
  - **skill-format-comment-code** — banner fijo de 3 líneas al inicio de todo
    archivo `.astro`/`.ts`/`.js` nuevo o editado.
- Indentación de 4 espacios. Comentarios de función con el bloque
  `*  -----  nombre()  -----  *` (5 guiones, sin `@param`/`@return`).
- Los tipos compartidos viven duplicados a propósito en
  `client/types/types.ts` y `server/src/types/types.ts`: **mantenerlos
  sincronizados al cambiar uno**.
- Sin dependencias externas nuevas salvo petición explícita del usuario.

## Frontend (Astro + ClientRouter)

- Cada componente se inicializa con `onPageReady(signal)` (`lib/dom.ts`) en
  `astro:page-load`; **todo listener nuevo debe recibir `{ signal }`** para
  abortarse al navegar.
- Comunicación entre componentes: evento `app:data-changed` (`lib/events.ts`)
  con payload tipado `{ type?: 'entry' | 'task' | 'subtask' | 'task-status',
  date? }`. Al consumirlo, leer el detalle con `dataChangeDetail(event)` y
  **no recargar de más**:
  - DayLog: `type === 'entry'` → solo `loadEntries()`.
  - Calendar: salta `task-status`; para `entry` solo recarga si la fecha cae
    en el mes visible.
  - SummaryCards / ReportPanel / TaskManager: saltan `task-status`.
- `DayLog` usa `transition:persist` (el DOM sobrevive a la navegación; la
  fecha viene de la URL). El calendario compacto usa morph
  (`transition:name`); `preAnchorCompact` en `astro:before-swap` lo ancla
  antes del swap — **no romper ese flujo**.
- Tema: la clave `THEME_STORAGE_KEY` vive en `lib/theme.ts`; el script
  anti-FOUC de Layout la recibe con `define:vars` (no hardcodearla).
- Útiles compartidos en `lib/`: `time.ts` (pad, formatMinutes, formatHours,
  rangos…), `draggable.ts` (placeFixed, dockFixed, readSavedPosition,
  `COMPACT_STORAGE_KEY`), `dom.ts` (create, query, showError, showConfirm,
  onPageReady). No reimplementar duplicados locales.

## Backend

- Capas: `routes` → `controllers` → `services` → `storage`. Validación en
  services (error → 400 `{ error }`; inexistente → 404).
- `jsonStorage`: escritura atómica (tmp + rename). Si `tasks.json` está
  corrupto, se respalda como `tasks.corrupto-<timestamp>.json` y se arranca
  vacío (nunca sobrescribir el original roto en silencio).
- Reglas de negocio: `title` único entre tareas activas (normalizado, sin
  mayúsculas ni espacios extra); `note` (actividad) obligatoria en registros;
  tramos que cruzan medianoche (`end < start`) suman 24 h.
- **Login**: credenciales en `server/data/users.json` (scrypt, sin
  dependencias externas; `usersStorage` en `storage/`). Sesiones en memoria
  (cookie `sid` httpOnly, 7 días; `auth.service.ts`). `/api/tasks`,
  `/api/entries` y `/api/reports` exigen sesión vía `requireAuth`; son
  públicos `/api/health`, `/api/auth/login` y `/api/auth/session` (este
  último responde siempre 200 `{ authenticated }` para que el guard no
  genere errores 401 en consola). Usuarios con `pnpm create-user` (script
  en `server/src/scripts/create-user.ts`). `LoginDto` y `AuthUser` viven
  duplicados en los `types.ts`.

## Frontend

- **Auth**: `/login` es la única página pública (prop `public` en Layout:
  sin sidebar ni header). El guard vive en el `<script is:inline>` del head
  (`window.__authGuard`, `define:vars={{ isPublic }}`): oculta la shell con
  `html.auth-pending` mientras consulta `/api/auth/session` y redirige al
  login (o fuera de él). Se re-ejecuta en cada `astro:page-load`. Logout en
  el pie del Sidebar. `api.ts` envía `credentials: 'include'` en todas las
  peticiones y redirige al login si una petición de datos devuelve 401.

## Despliegue (VPS Nginx + PM2)

- Dominio `https://my-daily-task-history.antonydev.es`; código en
  `/var/www/my-daily-task-history`; puerto `3010`; PM2 entrypoint
  `server/dist/index.js` (Express sirve `client/dist` + API).
- **Redespliegue (ya desplegado)**: `git push` en local → en el VPS
  `git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart
  my-daily-task-history` → comprobar `/api/health`. Detalles en el README.
- Los datos viven solo en el VPS (`server/data/tasks.json` + `users.json`):
  backup periódico manual.
