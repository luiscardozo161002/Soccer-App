# Arquitectura - App de Partidos

Stack: Next.js (frontend + backend) · TypeScript · PostgreSQL + Prisma · JWT · Redis · Resend · Vitest

## 1. Vista general de capas

```
┌─────────────────────────────────────────────────────────────┐
│ UI                                                            │
│ React · Tailwind · Lucide Icons · Sonner · React Hook Form    │
│ TanStack Table                                                │
└───────────────────────────────┬───────────────────────────────┘
                                 │ hooks
┌───────────────────────────────▼───────────────────────────────┐
│ Estado remoto                                                  │
│ TanStack Query  (cache, retry, invalidation)                   │
└───────────────────────────────┬───────────────────────────────┘
                                 │ Promise
┌───────────────────────────────▼───────────────────────────────┐
│ Cliente HTTP genérico                                          │
│ fetch() + ApiError + AbortController/timeout                   │
└───────────────────────────────┬───────────────────────────────┘
                                 │ HTTP
┌───────────────────────────────▼───────────────────────────────┐
│ API REST — Next.js Route Handlers  (/app/api/v1/**)            │
├─────────────────────────────────────────────────────────────┤
│ Cross-cutting: auth (JWT) · rate limiting · request-id · log   │
├─────────────────────────────────────────────────────────────┤
│ Validación de esquema — Zod DTOs                                │
├─────────────────────────────────────────────────────────────┤
│ Service Layer — reglas de negocio                               │
├─────────────────────────────────────────────────────────────┤
│ Repository — Prisma                                             │
└───────────────────────────────┬───────────────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                              ▼
          PostgreSQL (Prisma)              Redis (cache)
                                            Resend (email)
```

Principio rector: cada capa hace una sola cosa. TanStack Query no habla HTTP directamente (usa el cliente); el cliente HTTP no valida reglas de negocio; el Route Handler no accede a Prisma directamente (pasa por el Service).

## 2. Estructura de carpetas

```
app/
  api/
    v1/
      equipos/
        route.ts              GET (list), POST
        [id]/route.ts         GET, PATCH, DELETE
      jugadores/
        route.ts               GET (list, filtros por equipo), POST
        [id]/route.ts          GET, PATCH, DELETE
      canchas/
        route.ts               GET, POST
        [id]/route.ts          GET, PATCH, DELETE
      partidos/
        route.ts               GET (list, filtros: jornada, equipo, estado), POST
        [id]/route.ts          GET, PATCH, DELETE
        [id]/resultado/route.ts   PATCH  → registrar marcador (subrecurso, no PUT genérico)
      tarjetas/
        route.ts               GET, POST
        [id]/route.ts          GET, PATCH
        [id]/sanciones/route.ts  POST  → crear sanción derivada de una tarjeta
      tabla-posiciones/
        route.ts               GET (calculada, cacheada)
      auth/
        login/route.ts         POST
        refresh/route.ts       POST
      health/
        live/route.ts          GET
        ready/route.ts         GET
  (dashboard)/
    equipos/page.tsx
    jugadores/page.tsx
    partidos/page.tsx
    tabla-posiciones/page.tsx
    amonestados/page.tsx

lib/
  http/
    http-client.ts           fetch() genérico + ApiError + timeout
    endpoints.ts              get/post/patch/remove wrappers
  validation/
    equipo.schema.ts
    jugador.schema.ts
    cancha.schema.ts
    partido.schema.ts
    tarjeta.schema.ts
    auth.schema.ts
  services/
    equipo.service.ts
    jugador.service.ts
    partido.service.ts
    tarjeta.service.ts
    tabla-posiciones.service.ts
    auth.service.ts
  repositories/
    equipo.repository.ts
    jugador.repository.ts
    partido.repository.ts
    tarjeta.repository.ts
  middleware/
    with-auth.ts
    with-rate-limit.ts
    with-request-id.ts
    error-handler.ts
  cache/
    redis.ts
  email/
    resend.ts
  prisma.ts                   PrismaClient singleton

hooks/
  useEquipos.ts                TanStack Query hooks
  usePartidos.ts
  useTablaPosiciones.ts

prisma/
  schema.prisma
  migrations/

tests/
  services/                    Vitest: reglas de negocio
  api/                         Vitest: Route Handlers (integración)
```

## 3. Modelo de datos (Prisma)

JSON de la API en camelCase, columnas de base de datos en snake_case — Prisma hace el mapeo con `@map`/`@@map`.

```prisma
// prisma/schema.prisma

model Equipo {
  id            String   @id @default(uuid())
  nombre        String
  fechaIngreso  DateTime @map("fecha_ingreso") @default(now())
  foto          String?

  jugadores        Jugador[]
  partidosLocal    Partido[] @relation("PartidoLocal")
  partidosVisita   Partido[] @relation("PartidoVisitante")
  ajustesPuntos    AjustePuntos[]

  @@map("equipos")
}

model Jugador {
  id               String    @id @default(uuid())
  equipoId         String    @map("id_equipo")
  nombre           String
  foto             String?
  fechaNacimiento  DateTime? @map("fecha_nacimiento")
  folio            String    @unique

  equipo   Equipo    @relation(fields: [equipoId], references: [id])
  tarjetas Tarjeta[]

  @@map("jugadores")
}

model Cancha {
  id        String  @id @default(uuid())
  nombre    String
  ubicacion String?

  partidos Partido[]

  @@map("canchas")
}

enum EstadoPartido {
  programado
  jugado
  pospuesto
  cancelado
}

model Partido {
  id                 String        @id @default(uuid())
  equipoLocalId      String        @map("id_equipo_local")
  equipoVisitanteId  String        @map("id_equipo_visitante")
  canchaId           String        @map("id_cancha")
  jornada            Int
  fecha              DateTime
  hora               String
  golesLocal         Int?          @map("goles_local")
  golesVisitante     Int?          @map("goles_visitante")
  estado             EstadoPartido @default(programado)

  equipoLocal      Equipo    @relation("PartidoLocal", fields: [equipoLocalId], references: [id])
  equipoVisitante  Equipo    @relation("PartidoVisitante", fields: [equipoVisitanteId], references: [id])
  cancha           Cancha    @relation(fields: [canchaId], references: [id])
  tarjetas         Tarjeta[]

  @@map("partidos")
}

enum TipoTarjeta {
  amarilla
  roja
}

model Tarjeta {
  id                 String      @id @default(uuid())
  jugadorId          String      @map("id_jugador")
  partidoId          String      @map("id_partido")
  tipo               TipoTarjeta
  fechaModificacion  DateTime    @map("fecha_modificacion") @default(now())
  monto              Decimal?    @db.Decimal(10, 2)
  detalle            String?

  jugador   Jugador    @relation(fields: [jugadorId], references: [id])
  partido   Partido    @relation(fields: [partidoId], references: [id])
  sanciones Sancion[]

  @@map("tarjetas")
}

model Sancion {
  id                String  @id @default(uuid())
  tarjetaId         String  @map("id_tarjeta")
  jornadaInicio     Int     @map("jornada_inicio")
  jornadaFin        Int     @map("jornada_fin")
  partidosSancion   Int     @map("partidos_sancion")
  cumplida          Boolean @default(false)

  tarjeta Tarjeta @relation(fields: [tarjetaId], references: [id])

  @@map("sanciones")
}

model AjustePuntos {
  id        String   @id @default(uuid())
  equipoId  String   @map("id_equipo")
  puntos    Int
  motivo    String
  fecha     DateTime @default(now())

  equipo Equipo @relation(fields: [equipoId], references: [id])

  @@map("ajustes_puntos")
}
```

**Tabla de posiciones**: no es un modelo Prisma con datos propios — se calcula. Dos opciones, en orden de preferencia:
1. Query agregada en `tabla-posiciones.service.ts` (`groupBy`/`aggregate` de Prisma sobre `Partido` + `AjustePuntos`).
2. Vista SQL (`CREATE VIEW`) consultada con `prisma.$queryRaw` si la agregación en TS se vuelve compleja.

Cualquiera de las dos se cachea en Redis (sección 8) porque es costosa y cambia solo cuando se registra un resultado.

## 4. Contrato de la API

### Envelope de respuesta

Éxito (colección):
```json
{ "success": true, "data": [ /* ... */ ], "meta": { "page": 1, "pageSize": 20, "totalItems": 84, "totalPages": 5 } }
```

Éxito (recurso único):
```json
{ "success": true, "data": { "id": "...", "nombre": "..." } }
```

Error:
```json
{ "success": false, "error": { "code": "PARTIDO_CANCHA_OCUPADA", "message": "La cancha ya tiene un partido en ese horario", "details": null } }
```

Error de validación (Zod):
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request inválida", "details": [{ "field": "fechaNacimiento", "message": "Fecha inválida" }] } }
```

`message` en éxito solo cuando aporta contexto (ej. `"Partido creado"`), no en un GET simple.

### Status codes

| Código | Uso |
|---|---|
| 200 | GET / PATCH exitoso |
| 201 | POST creó un recurso |
| 204 | DELETE exitoso |
| 400 | Request mal formada |
| 401 | No autenticado / token inválido |
| 403 | Autenticado, sin permiso (ej. rol no-admin) |
| 404 | Recurso inexistente |
| 409 | Conflicto de negocio (cancha ocupada, folio duplicado) |
| 422 | Validación de esquema fallida (Zod) |
| 429 | Rate limit |
| 500 | Error inesperado |
| 503 | Dependencia caída (usado en `/health/ready`) |

### Endpoints principales

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/equipos              ?page&pageSize
POST   /api/v1/equipos
GET    /api/v1/equipos/:id
PATCH  /api/v1/equipos/:id
DELETE /api/v1/equipos/:id

GET    /api/v1/jugadores            ?equipoId&page&pageSize
POST   /api/v1/jugadores
GET    /api/v1/jugadores/:id
PATCH  /api/v1/jugadores/:id
DELETE /api/v1/jugadores/:id

GET    /api/v1/canchas
POST   /api/v1/canchas

GET    /api/v1/partidos             ?jornada&equipoId&estado&from&to
POST   /api/v1/partidos
GET    /api/v1/partidos/:id
PATCH  /api/v1/partidos/:id
PATCH  /api/v1/partidos/:id/resultado     ← registrar marcador (subrecurso de estado)

GET    /api/v1/tarjetas             ?jugadorId&tipo
POST   /api/v1/tarjetas
POST   /api/v1/tarjetas/:id/sanciones

GET    /api/v1/tabla-posiciones     (cacheada en Redis)

GET    /api/v1/health/live
GET    /api/v1/health/ready
```

Filtros como query params sobre el recurso (`?estado=jugado`), no endpoints por combinación (`/getPartidosPorEstado`). Enums de dominio (`estado=jugado|programado`) en vez de booleans (`?jugado=true`).

## 5. Cliente HTTP + TanStack Query (frontend)

```ts
// lib/http/http-client.ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, public details?: unknown) {
    super(code);
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

export async function http<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 10_000, headers, ...config } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(response.status, body?.error?.code ?? "HTTP_ERROR", body?.error?.details);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

```ts
// hooks/usePartidos.ts
export function usePartidos(filters: PartidoFilters) {
  return useQuery({
    queryKey: ["partidos", filters],
    queryFn: () => get<PartidoListResponse>(`/api/v1/partidos?${toQueryString(filters)}`),
  });
}

export function useRegistrarResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; data: RegistrarResultadoDto }) =>
      patch<PartidoResponse>(`/api/v1/partidos/${input.id}/resultado`, input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partidos"] });
      queryClient.invalidateQueries({ queryKey: ["tabla-posiciones"] });
    },
    retry: (count, error) => (error instanceof ApiError && [400,401,403,404,409,422].includes(error.status) ? false : count < 2),
  });
}
```

Ambos se complementan: `fetch` resuelve el transporte, TanStack Query resuelve sincronización/cache/estado — no hay que elegir uno u otro.

## 6. Validación (Zod) — separada de reglas de negocio

```ts
// lib/validation/partido.schema.ts
export const registrarResultadoSchema = z.object({
  golesLocal: z.number().int().min(0),
  golesVisitante: z.number().int().min(0),
});
export type RegistrarResultadoDto = z.infer<typeof registrarResultadoSchema>;
```

Zod valida forma (`¿es un entero ≥ 0?`). El Service valida negocio (`¿el partido existe?, ¿ya estaba jugado?, ¿la jornada ya cerró?`) y es quien lanza `ApiError` con código `409`/`404` cuando corresponde.

```ts
// lib/services/partido.service.ts
export async function registrarResultado(id: string, dto: RegistrarResultadoDto) {
  const partido = await partidoRepository.findById(id);
  if (!partido) throw new ApiError(404, "PARTIDO_NOT_FOUND");
  if (partido.estado === "jugado") throw new ApiError(409, "PARTIDO_YA_JUGADO");

  const actualizado = await partidoRepository.registrarResultado(id, dto);
  await cache.invalidate("tabla-posiciones");
  return actualizado;
}
```

## 7. Cross-cutting (middleware separado por responsabilidad)

No un middleware único: cada preocupación en su propio wrapper componible sobre el Route Handler.

```
withRequestId → withRateLimit → withAuth → handler (valida DTO → llama Service)
```

- **Auth**: JWT verificado en `withAuth`, adjunta `userId`/`role` al contexto.
- **Rate limiting**: Redis + sliding window (ej. `@upstash/ratelimit`), responde `429` con headers `RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After`.
- **Request-id**: header `x-request-id` generado o propagado, usado en logs.
- **Logging estructurado**: JSON con `requestId`, `route`, `status`, `durationMs`.

## 8. Cache (Redis)

Uso puntual, no generalizado:
- `tabla-posiciones`: se cachea el resultado calculado; se invalida cuando `PATCH /partidos/:id/resultado` o cualquier cambio en `ajustes_puntos` ocurre.
- Rate limiting: contadores de ventana deslizante.
- TanStack Query ya cubre el cache del lado del cliente — Redis solo entra cuando el cálculo del lado del servidor es costoso o debe compartirse entre instancias.

## 9. Email (Resend)

Casos de uso: notificar a un equipo cuando se publica su horario de jornada, o cuando un jugador recibe una sanción. Se dispara **después** de responder al cliente (no bloquea el `201`/`200`):

```ts
await partidoRepository.registrarResultado(id, dto);
await cache.invalidate("tabla-posiciones");
void emailService.notificarResultado(partido).catch((err) => logger.error(err)); // fire-and-forget, no bloquea la respuesta
return actualizado;
```

## 10. Documentación (Swagger)

Los mismos esquemas Zod generan el spec OpenAPI con `zod-to-openapi`, evitando mantener la documentación por separado del contrato real. Se sirve en `/api/v1/docs`.

## 11. Health checks

```ts
// app/api/v1/health/live/route.ts
export async function GET() {
  return Response.json({ status: "up" });
}
```

```ts
// app/api/v1/health/ready/route.ts
export async function GET() {
  const dbOk = await checkDatabase();
  const redisOk = await checkRedis();
  const ok = dbOk && redisOk;
  return Response.json(
    { status: ok ? "up" : "down", checks: { database: dbOk ? "up" : "down", redis: redisOk ? "up" : "down" } },
    { status: ok ? 200 : 503 }
  );
}
```

## 12. Testing (Vitest)

- **`tests/services/*.test.ts`**: reglas de negocio puras (ej. "no se puede registrar resultado de un partido ya jugado"), con el repositorio mockeado.
- **`tests/api/*.test.ts`**: Route Handlers de extremo a extremo contra una base de datos de prueba (Postgres en Docker o `pg-mem`), verificando status code + forma del envelope.

## 13. Resumen de decisiones clave

| Decisión | Motivo |
|---|---|
| `tabla-posiciones` calculada, no tabla física | Evita desincronización manual con `partidos` |
| `resultado` como subrecurso de `partidos` (`PATCH .../resultado`) | Acción de negocio explícita, no un PUT genérico que sobreescribe todo el partido |
| Validación Zod separada del Service | Estructura vs. negocio son preocupaciones distintas y se testean distinto |
| Redis solo para lo costoso/compartido | TanStack Query ya cubre cache de cliente; no duplicar sin necesidad |
| Email fire-and-forget tras la respuesta | No bloquear al cliente por un efecto secundario no crítico |
| camelCase en API, mapeo Prisma a snake_case en BD | Consistencia dentro de cada capa sin forzar una convención sobre la otra |
