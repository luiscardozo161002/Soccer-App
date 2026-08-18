# Arquitectura

Stack: Next.js 16 (App Router, frontend + backend) · TypeScript · PostgreSQL + Prisma 7 · JWT
(cookie de sesión) · Redis (opcional) · Resend · Tailwind CSS v4 · TanStack Query

> Este documento describe la implementación **actual** del repositorio. Para el volcado completo
> del esquema de base de datos ver [`docs/schema.sql`](./schema.sql); para cómo levantar el
> proyecto en local ver el [README](../README.md).

## 1. Vista general de capas

```
┌─────────────────────────────────────────────────────────────┐
│ UI                                                            │
│ React · Tailwind · Lucide Icons · Sonner · React Hook Form    │
└───────────────────────────────┬───────────────────────────────┘
                                 │ hooks (uno por recurso)
┌───────────────────────────────▼───────────────────────────────┐
│ Estado remoto — TanStack Query (cache, retry, invalidation)   │
└───────────────────────────────┬───────────────────────────────┘
                                 │ Promise
┌───────────────────────────────▼───────────────────────────────┐
│ Cliente HTTP genérico — lib/http (fetch + ApiError)            │
└───────────────────────────────┬───────────────────────────────┘
                                 │ HTTP
┌───────────────────────────────▼───────────────────────────────┐
│ proxy.ts — sesión + rate limiting (corre antes que la ruta)   │
├─────────────────────────────────────────────────────────────┤
│ API REST — Next.js Route Handlers (app/api/v1/**)              │
│   withErrorHandling → valida DTO (Zod) → Service                │
├─────────────────────────────────────────────────────────────┤
│ Service Layer — reglas de negocio, lanza ApiError               │
├─────────────────────────────────────────────────────────────┤
│ Repository — único punto de acceso a Prisma                    │
└───────────────────────────────┬───────────────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                              ▼
          PostgreSQL (Prisma)              Redis (rate limiting)
                                            Resend (reset de contraseña)
```

Principio rector: cada capa hace una sola cosa. El route handler nunca importa Prisma
directamente — siempre pasa por el service, y el service nunca construye una query Prisma
directamente — siempre pasa por el repository.

`proxy.ts` reemplaza al `middleware.ts` clásico de Next.js (ver [AGENTS.md](../AGENTS.md): esta
versión del framework difiere de versiones anteriores en varios puntos — revisar
`node_modules/next/dist/docs/` antes de asumir convenciones de otras versiones). No hay una pila
de middlewares componibles por ruta (`withAuth`, `withRateLimit`, etc.); toda la lógica
transversal de auth + rate limiting vive en ese único archivo, que corre antes de que la request
llegue a cualquier route handler.

## 2. Estructura de carpetas (real)

```
app/
  (landing)/page.tsx        Sitio público: calendario, tabla de posiciones, equipos
  (platform)/admin/
    layout.tsx                Shell del panel (sidebar + área de contenido)
    page.tsx                  Tabla de posiciones
    teams/ players/ matches/ fields/ sanctions/ settings/ history/
    cup/  cup/[id]/            Copa: lista de torneos y detalle de un torneo
  login/ forgot-password/ reset-password/
  api/v1/
    auth/            login, logout, me, forgot-password, reset-password
    teams/            list+create, [id] (get/patch/delete), [id]/photo
    players/          list+create, [id], [id]/photo
    fields/           list+create, [id]
    matches/          list+create, [id], [id]/result
    cards/            list+create, [id], [id]/pay, [id]/sanctions
    sanctions/        list+create, [id], [id]/pay
    cups/             list+create, [id]
    cup-entries/      list+create, [id]/withdraw
    cup-matches/      list+create, [id], [id]/result, [id]/reopen
    seasons/          list+create, [id]
    standings/        GET, calculada en tiempo real (sin caché)
    settings/         GET/PATCH, settings/logo
    users/            list+create, [id], [id]/photo   (admins del panel)
    tournament/reset/ POST — reinicia una temporada
  generated/prisma/    Cliente de Prisma generado — no editar a mano
  not-found.tsx        404 (comparte contenedor visual con login)

components/
  ui/                Primitivas compartidas: Table, Modal, Field/Select, Pagination,
                      CategoryBadge, EmptyOptionsHint, confirm-dialog, etc.
  forms/              Modales de edición por recurso (EditTeamModal, EditMatchModal, ...)
  tables/             Tablas con su propio estado de listado/paginación/filtros
  auth/               AuthShell + BrandPanel — contenedor visual de login/forgot/reset/404

hooks/                Un hook TanStack Query por recurso (useTeams, usePlayers, useMatches, ...)

lib/
  auth/session.ts         Firma/verifica el JWT de sesión (jose)
  http/                    http-client.ts (fetch + ApiError), endpoints.ts (get/post/patch/remove),
                           api-routes.ts (rutas de la API como constantes)
  middleware/error-handler.ts   withErrorHandling — envelope de error uniforme
  repositories/            Un archivo por recurso, único lugar que importa Prisma
  services/                Reglas de negocio, un archivo por recurso
  validation/               Schemas Zod por recurso (se reutilizan en cliente y servidor)
  security/rate-limit.ts   Rate limiting: Redis (INCR + EXPIRE) con fallback a Map en memoria
  constants/                Categorías de liga, motivos de tarjeta, etc.
  email/resend.ts          Envío del correo de restablecimiento de contraseña
  utils/                    Helpers de fecha, imágenes (sharp), formularios

prisma/
  schema.prisma            Modelo de datos
  seeds/                    Un seeder por recurso, orquestados desde seed.ts
  seed-data/                JSON de datos de ejemplo consumidos por los seeders
  bootstrap-admin.ts        Crea/asegura un usuario admin sin correr el seed completo

proxy.ts                   Sesión (redirige a /login sin sesión) + rate limiting de auth
```

No existe (a pesar de tenerlo como devDependency) una suite de tests con Vitest todavía, ni
endpoints de health check, ni documentación OpenAPI/Swagger generada — si se agregan, actualizar
esta sección.

## 3. Modelo de datos (Prisma)

Modelos reales (ver `prisma/schema.prisma` para el detalle completo de columnas/relaciones y
`docs/schema.sql` para el DDL):

`Season` · `Team` · `Player` · `Field` · `Match` · `Card` · `Sanction` · `PointAdjustment` ·
`Cup` · `CupEntry` · `CupMatch` · `SiteSettings` · `User`

Enums de dominio: `Status` (active/inactive), `MatchStatus`, `CardType`, `SeasonStatus`,
`LeagueCategory` (`primera_division` / `division_ascenso` / `segunda_division`), `CupStatus`,
`CupEntryStatus`, `CupMatchStatus`.

JSON de la API en camelCase, columnas de base de datos en snake_case — Prisma hace el mapeo con
`@map`/`@@map`.

**Tabla de posiciones**: no es una tabla con datos propios — se calcula con una consulta SQL
agregada (`lib/repositories/standings.repository.ts`, `prisma.$queryRaw` con `Prisma.sql`
parametrizado) sobre `Match` para la temporada activa, en cada request. No hay caché: es
suficientemente barata para el volumen de datos de una liga amateur.

**Categorías**: `Team.category` es el dato fuente; `Match.category` se deriva del equipo local al
crear el partido (ambos equipos de un partido deben ser de la misma categoría, validado en
`match.service.ts`). Los filtros por categoría en equipos/jugadores/partidos se resuelven en el
repository (`WHERE category = ...`, o vía la relación `team` para jugadores).

## 4. Contrato de la API

### Envelope de respuesta

Éxito (colección):
```json
{ "success": true, "data": [ /* ... */ ], "meta": { "page": 1, "pageSize": 20, "totalItems": 84, "totalPages": 5 } }
```

Éxito (recurso único), `message` opcional cuando aporta contexto (ej. `"Team created"`):
```json
{ "success": true, "data": { "id": "...", "name": "..." }, "message": "Team created" }
```

Error:
```json
{ "success": false, "error": { "code": "MATCH_RESULT_LOCKED", "message": "...", "details": null } }
```

Error de validación (Zod, vía `withErrorHandling`):
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request inválida", "details": [{ "field": "name", "message": "..." }] } }
```

### Status codes en uso

| Código | Uso |
|---|---|
| 200 | GET / PATCH exitoso |
| 201 | POST creó un recurso |
| 204 | DELETE exitoso (`noContent()`) |
| 400 | Request mal formada (caso puntual) |
| 401 | No autenticado / sesión inválida |
| 404 | Recurso inexistente |
| 409 | Conflicto de negocio (cancha ocupada, folio duplicado, resultado ya confirmado, FK/unique constraint) |
| 422 | Validación de esquema fallida (Zod) |
| 429 | Rate limit (`login`/`forgot-password`/`reset-password`) |
| 500 | Error inesperado |

`withErrorHandling` (`lib/middleware/error-handler.ts`) traduce automáticamente `ZodError` → 422,
`ApiError` → su `status`/`code` propios, y errores conocidos de Prisma (FK violation, unique
violation, "not found") → 409/404. Todo lo demás cae a 500 con log en servidor.

### Endpoints (resumen — el listado completo está en `app/api/v1/**`)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/teams                ?page&pageSize&category
POST   /api/v1/teams
GET    /api/v1/teams/:id
PATCH  /api/v1/teams/:id
DELETE /api/v1/teams/:id
GET    /api/v1/teams/:id/photo

GET    /api/v1/players              ?page&pageSize&teamId&category
POST   /api/v1/players
GET|PATCH|DELETE  /api/v1/players/:id
GET    /api/v1/players/:id/photo

GET    /api/v1/fields               ?page&pageSize
POST   /api/v1/fields
GET|PATCH|DELETE  /api/v1/fields/:id

GET    /api/v1/matches              ?page&pageSize&matchday&teamId&status&category&seasonId
POST   /api/v1/matches
GET|PATCH|DELETE  /api/v1/matches/:id
PATCH  /api/v1/matches/:id/result    ← registrar marcador (subrecurso, no PATCH genérico)

GET    /api/v1/cards                ?matchId&playerId&type
POST   /api/v1/cards
GET|PATCH|DELETE  /api/v1/cards/:id
POST   /api/v1/cards/:id/pay
POST   /api/v1/cards/:id/sanctions   ← crea la sanción (no hay POST /api/v1/sanctions suelto)

GET    /api/v1/sanctions            ?fulfilled
GET|PATCH  /api/v1/sanctions/:id
POST   /api/v1/sanctions/:id/pay

GET    /api/v1/cups                 POST /api/v1/cups
GET    /api/v1/cups/:id              (sin PATCH/DELETE todavía)
GET    /api/v1/cup-entries          POST /api/v1/cup-entries   (inscribir equipos)
PATCH  /api/v1/cup-entries/:id/withdraw
GET    /api/v1/cup-matches          POST /api/v1/cup-matches
GET|PATCH|DELETE  /api/v1/cup-matches/:id
PATCH  /api/v1/cup-matches/:id/result
POST   /api/v1/cup-matches/:id/reopen

GET    /api/v1/seasons              (sin POST — las temporadas se crean por seed/bootstrap, no por la API)
GET    /api/v1/seasons/:id
POST   /api/v1/tournament/reset      ← reinicia una temporada (borra resultados/tarjetas)

GET    /api/v1/standings            ?seasonId  (calculada en tiempo real, sin caché)

GET|PATCH  /api/v1/settings          ← el logo se sube aquí como `logo` en base64
GET    /api/v1/settings/logo         ← sirve el binario del logo ya guardado

GET    /api/v1/users                POST /api/v1/users   (admins del panel)
GET|PATCH|DELETE  /api/v1/users/:id
GET    /api/v1/users/:id/photo
```

Filtros como query params sobre el recurso (`?status=played`), no endpoints por combinación.
Enums de dominio en vez de booleans.

## 5. Cliente HTTP + TanStack Query (frontend)

`lib/http/http-client.ts` expone un `fetch()` genérico con manejo de `ApiError`; `lib/http/endpoints.ts`
envuelve `get/post/patch/remove`; `lib/http/api-routes.ts` centraliza las rutas como constantes
(`API_ROUTES.teams.list`, etc.) para no repetir strings `"/api/v1/..."` por todo el código.

Cada recurso tiene su propio hook en `hooks/` que combina ambos con TanStack Query:

```ts
// hooks/useMatches.ts (forma real, simplificada)
export function useMatches(filters: MatchFilters = {}) {
  return useQuery({
    queryKey: ["matches", filters],
    queryFn: () => get<ListResponse<Match>>(`${API_ROUTES.matches.list}?${toQueryString(filters)}`),
  });
}

export function useRegisterResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RegisterResultInput & { id: string }) =>
      patch<ItemResponse<Match>>(API_ROUTES.matches.result(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });
}
```

Mutaciones que afectan la tabla de posiciones invalidan explícitamente la query `["standings"]"`
además de la suya propia — no hay un mecanismo automático de invalidación cruzada.

## 6. Validación (Zod) — separada de reglas de negocio

```ts
// lib/validation/match.schema.ts (real)
export const registerResultSchema = z.object({
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
  forfeit: z.boolean().optional(),
  forfeitReason: z.string().trim().max(300).optional(),
});
export type RegisterResultDto = z.infer<typeof registerResultSchema>;
```

Zod valida forma (`¿es un entero ≥ 0?`). El service valida negocio (`¿el partido existe?, ¿ya
tiene resultado confirmado?, ¿ya pasó la hora del partido?`) y lanza `ApiError` con el código y
status correctos — nunca al revés.

Varios schemas de validación (ej. `lib/validation/password.ts`) se reutilizan tal cual en el
cliente (`zodResolver` de `react-hook-form`) y en el servidor, para no duplicar reglas.

## 7. Autenticación y rate limiting (proxy.ts)

- **Sesión**: JWT (HS256, `jose`) firmado con `JWT_SECRET`, guardado en una cookie httpOnly
  (`lib/auth/session.ts`). El payload lleva `sub` (userId), `username` y `role`. `role` existe en
  el modelo `User` pero hoy solo tiene el valor `"admin"` — no hay lógica de permisos
  diferenciados por rol todavía.
- **Gate de sesión** (`proxy.ts`): cualquier ruta bajo `/admin` sin sesión válida redirige a
  `/login?next=<ruta original>`; cualquier método distinto de `GET` bajo `/api/v1/*` (y
  `/api/v1/users` incluso en `GET`, porque lista datos de administradores) responde `401` sin
  sesión.
- **`next` seguro**: el login valida que `next` sea una ruta interna (`/algo`, no
  `//host` ni una URL absoluta) antes de redirigir tras autenticar — evita open redirect.
- **Rate limiting** (`lib/security/rate-limit.ts`): contador de ventana fija (`INCR` + `EXPIRE` en
  Redis, o un `Map` en memoria si no hay `REDIS_URL`), aplicado por IP a
  `POST /api/v1/auth/{login,forgot-password,reset-password}`. Al superar el límite responde `429`
  con header `Retry-After`. Límites/ventanas configurables por variables de entorno (ver
  `.env.example`). El contador en memoria solo vive mientras el proceso del servidor esté vivo —
  se reinicia si el servidor se reinicia, y no se comparte entre instancias sin Redis.

## 8. Email (Resend)

Único caso de uso implementado: el correo de restablecimiento de contraseña
(`lib/email/resend.ts`, `sendPasswordResetEmail`). Sin `RESEND_API_KEY`/`EMAIL_FROM` configurados,
`emailDeliveryEnabled` es `false` y el flujo de "olvidé mi contraseña" devuelve el enlace en la
respuesta de la API en vez de enviarlo por correo — pensado solo para desarrollo local, nunca para
producción.

## 9. Resumen de decisiones clave

| Decisión | Motivo |
|---|---|
| `standings` calculada con SQL agregado, sin caché | Costo bajo para el volumen de datos de una liga amateur; evita desincronización manual |
| `result` como subrecurso de `matches`/`cup-matches` (`PATCH .../result`) | Acción de negocio explícita (bloquea edición posterior), no un PATCH genérico que sobreescribe todo el partido |
| Validación Zod separada del service | Estructura vs. negocio son preocupaciones distintas y se reutilizan distinto (Zod también corre en el cliente) |
| `proxy.ts` único en vez de middlewares componibles por ruta | Next.js 16 solo permite un proxy raíz; auth + rate limiting son las únicas preocupaciones transversales necesarias hoy |
| Rate limiting con fallback a memoria si no hay Redis | Dev local no debería depender de tener Redis corriendo; producción sí debería configurar `REDIS_URL` para que el límite se comparta entre instancias |
| Categorías de liga como filtro en cada recurso (equipos/jugadores/partidos), no un endpoint separado por categoría | Consistente con el resto de los filtros de la API (query params sobre el recurso) |
| camelCase en API, mapeo Prisma a snake_case en BD | Consistencia dentro de cada capa sin forzar una convención sobre la otra |
